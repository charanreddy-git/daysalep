"""WSGI entrypoint for hosts that only look at default module names.

Vercel's Python runtime searches for `app.py`, `index.py`, `server.py`,
`main.py`, `wsgi.py`, or `asgi.py` (also inside `src/` or `app/`) and refuses
anything else — `application.py` gets reported as a *potential* entrypoint and
the deploy fails with FLASK_ENTRYPOINT_NOT_FOUND. Re-exporting the Flask app
from here satisfies that detection without moving any code.

Works everywhere else too:

    gunicorn wsgi:app --bind 0.0.0.0:$PORT
"""

from __future__ import annotations

from application import app

__all__ = ["app"]
