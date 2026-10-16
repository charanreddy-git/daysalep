"""JavaScript-style number parsing helpers used by the analysis modules."""

import re

_NUMBER_PREFIX_RE = re.compile(r"^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?")
_INT_PREFIX_RE = re.compile(r"^[+-]?\d+")


def to_number(value: object) -> float:
    """Mimic JS Number.parseFloat over cells, returning 0 when not finite."""
    text = str(value or "").replace("\ufeff", "").strip().replace(",", "")
    if not text:
        return 0
    match = _NUMBER_PREFIX_RE.match(text)
    if not match:
        return 0
    parsed = float(match.group(0))
    return int(parsed) if parsed.is_integer() else parsed


def to_int(value: object) -> int:
    """Mimic JS Number.parseInt(value, 10), returning 0 when not parseable."""
    text = str(value if value is not None else "").strip()
    match = _INT_PREFIX_RE.match(text)
    if not match:
        return 0
    return int(match.group(0))
