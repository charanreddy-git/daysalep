"""Upload orchestration: detect the file type and build the normalized result."""

import os
import tempfile

from lib.errors import ParserError, create_parser_error
from lib.file_type import detect_file_type
from lib.html_parser import extract_date_from_html, extract_depot_from_html, parse_html_rows
from lib.pdf_parser import parse_pdf
from lib.result import build_result


def parse_upload(file_storage):
    buffer = file_storage.read() or b""
    filename = file_storage.filename or ""
    mime_type = file_storage.mimetype or ""

    file_type = detect_file_type(filename, mime_type, buffer)
    if not file_type:
        raise create_parser_error("Unsupported file type. Upload .htm, .html, or .pdf.")

    if file_type == "pdf":
        parsed = _parse_pdf_buffer(buffer)
        return build_result(
            parsed.get("rows") or [],
            parsed.get("extractedDate") or "",
            {
                "source_type": "pdf",
                "filename": filename or "upload.pdf",
                "mime_type": mime_type or "application/pdf",
                "depot": parsed.get("depot") or None,
            },
        )

    html = buffer.decode("utf-8", "replace")
    depot = extract_depot_from_html(html)
    return build_result(
        parse_html_rows(html),
        extract_date_from_html(html),
        {
            "source_type": "htm",
            "filename": filename,
            "mime_type": mime_type,
            "depot": depot,
        },
    )


def _parse_pdf_buffer(buffer):
    handle = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    try:
        handle.write(buffer)
        handle.close()
        return parse_pdf(handle.name)
    except ParserError:
        raise
    except Exception as error:
        raise create_parser_error(str(error) or "PDF parsing failed.", 500) from error
    finally:
        try:
            os.unlink(handle.name)
        except OSError:
            pass
