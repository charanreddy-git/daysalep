"""DaySale web application.

Elastic Beanstalk expects ``application.py`` with an ``application``
callable at the repository root, so this file stays here.

Run locally:

    python application.py

Run in production (Elastic Beanstalk, App Runner, ECS, EC2, ...):

    gunicorn application:application --bind :8000
"""

from __future__ import annotations

import os
import threading

from flask import Flask, g, jsonify, request, send_from_directory
from werkzeug.utils import safe_join

from lib.errors import ParserError, create_parser_error
from lib.logger import init_request_logging
from lib.parse import parse_upload
from lib.ratelimit import check_rate_limit

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _int_env(name, default):
    try:
        return int(os.environ.get(name) or default)
    except ValueError:
        return default


PARSE_TIMEOUT_MS = _int_env("PARSE_TIMEOUT_MS", 50_000)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + 2 * 1024 * 1024
init_request_logging(app)


def _stream_size(upload):
    stream = upload.stream
    try:
        stream.seek(0, os.SEEK_END)
        size = stream.tell()
        stream.seek(0)
        return size
    except (OSError, ValueError):
        return 0


def _with_timeout(callback, timeout_ms):
    outcome = {}

    def run():
        try:
            outcome["value"] = callback()
        except BaseException as error:  # pragma: no cover - re-raised below
            outcome["error"] = error

    worker = threading.Thread(target=run, daemon=True)
    worker.start()
    worker.join(timeout_ms / 1000)

    if worker.is_alive():
        raise create_parser_error("Request timed out.", 504)
    if "error" in outcome:
        raise outcome["error"]
    return outcome["value"]


@app.get("/api/test")
@app.get("/healthz")
def health():
    return jsonify(success=True)


@app.post("/api/parse")
def parse_route():
    log = g.log

    if not check_rate_limit():
        return jsonify(success=False, error="Too many requests. Please try again later."), 429

    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify(success=False, error="No file uploaded."), 400

    try:
        log.info("Parsing upload", filename=upload.filename, size=_stream_size(upload))
        result = _with_timeout(lambda: parse_upload(upload), PARSE_TIMEOUT_MS)
        log.info("Parse complete", rows=result["conversion"]["rowsProcessed"])
        return jsonify(success=True, result=result)
    except ParserError as error:
        log.error("Parse failed", error=str(error))
        message = str(error) or "Unable to parse the uploaded file."
        return jsonify(success=False, error=message), error.status
    except Exception as error:  # mirrors the old Node fallback status
        log.error("Parse failed", error=str(error))
        message = str(error) or "Unable to parse the uploaded file."
        return jsonify(success=False, error=message), 400


@app.errorhandler(413)
def upload_too_large(_error):
    return jsonify(success=False, error="File is too large. The maximum upload size is 10 MB."), 413


@app.get("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.get("/<path:path>")
def static_or_index(path):
    target = safe_join(PUBLIC_DIR, path)
    if target and os.path.isfile(target):
        return send_from_directory(PUBLIC_DIR, path)
    return send_from_directory(PUBLIC_DIR, "index.html")


application = app  # WSGI entrypoint used by Elastic Beanstalk and gunicorn


if __name__ == "__main__":
    port = _int_env("PORT", 2323)
    print(f"Listening on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port)
