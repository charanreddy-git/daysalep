"""WSGI entrypoint for Vercel.

Vercel's Python runtime looks for a Flask `app` in `app.py`, `index.py`,
`server.py`, `main.py`, `wsgi.py`, or `asgi.py`. This file re-exports the app
from `application.py` so Vercel can detect it without renaming the main module.
"""

from __future__ import annotations

from application import app

__all__ = ["app"]
