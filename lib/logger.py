"""JSON request logging (port of lib/logger.js)."""

import json
import sys
import uuid
from types import SimpleNamespace

from flask import g, request


def create_logger(**context: object) -> SimpleNamespace:
    def emit(level: str, stream: object, message: str, data: dict) -> None:
        print(json.dumps({"level": level, **context, **data, "message": message}), file=stream, flush=True)

    return SimpleNamespace(
        info=lambda message, **data: emit("info", sys.stdout, message, data),
        warn=lambda message, **data: emit("warn", sys.stderr, message, data),
        error=lambda message, **data: emit("error", sys.stderr, message, data),
    )


def init_request_logging(app) -> None:
    """Attach a per-request logger to ``g`` (port of the Node requestLogger)."""

    @app.before_request
    def _attach_request_logger() -> None:
        g.request_id = str(uuid.uuid4())
        g.log = create_logger(requestId=g.request_id, method=request.method, path=request.path)
