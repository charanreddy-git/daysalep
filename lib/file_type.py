"""Upload file type detection based on name, MIME type, and magic bytes."""

PDF_MAGIC = b"%PDF-"


def detect_file_type(file_name, mime_type, buffer):
    name = str(file_name or "").lower()
    mime = str(mime_type or "").lower()

    if name.endswith(".pdf") or "pdf" in mime:
        data = buffer or b""
        if len(data) >= 5 and data[:5] != PDF_MAGIC:
            return ""
        return "pdf"

    if name.endswith(".htm") or name.endswith(".html") or "html" in mime:
        return "htm"

    return ""
