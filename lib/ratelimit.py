"""In-memory per-client rate limiting (port of lib/ratelimit.js)."""

import os
import threading
import time
from typing import Dict

from flask import request

RATE_LIMIT_WINDOW_MS = int(os.environ.get("RATE_LIMIT_WINDOW_MS", "60000"))
RATE_LIMIT_MAX = int(os.environ.get("RATE_LIMIT_MAX", "30"))

_hits: Dict[str, Dict[str, float]] = {}
_lock = threading.Lock()


def is_rate_limited(key: str) -> bool:
    now = time.time() * 1000

    with _lock:
        entry = _hits.get(key)
        # Same expiry math as the old Node limiter.
        if entry is None or now - entry["reset"] > RATE_LIMIT_WINDOW_MS:
            entry = {"count": 0, "reset": now + RATE_LIMIT_WINDOW_MS}
            _hits[key] = entry

        entry["count"] += 1
        return entry["count"] > RATE_LIMIT_MAX


def _client_key() -> str:
    return request.remote_addr or request.headers.get("X-Forwarded-For") or "unknown"


def check_rate_limit() -> bool:
    """True when the request may proceed; False when it should get a 429."""
    return not is_rate_limited(_client_key())
