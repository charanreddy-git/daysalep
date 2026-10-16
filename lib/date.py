"""Date helpers (port of lib/date.js)."""

from datetime import datetime, timedelta
from typing import Optional


def get_month_number(month_name: str) -> str:
    months = {
        "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
        "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    }
    return months.get(str(month_name or "").lower()[:3], "01")


def get_today_date() -> str:
    today = datetime.now()
    return f"{today.day:02d}/{today.month:02d}/{today.year}"


def get_next_day_date(date_string: str) -> str:
    if not date_string:
        return date_string

    parts = str(date_string).split("/")
    if len(parts) != 3:
        return date_string

    try:
        day, month, year = (int(part) for part in parts)
    except ValueError:
        return date_string

    if not day or not month or not year:
        return date_string
    if not 1 <= month <= 12:
        return date_string

    next_day = datetime(year, month, 1) + timedelta(days=day)
    return f"{next_day.day:02d}/{next_day.month:02d}/{next_day.year}"


def _is_numeric(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


def parse_date_string(date_str: str) -> Optional[str]:
    if not date_str:
        return None

    if "-" in date_str and len(date_str) > 8:
        parts = date_str.split("-")
        if len(parts) == 3 and not _is_numeric(parts[1]):
            return f"{parts[0].zfill(2)}/{get_month_number(parts[1])}/{parts[2]}"

    if "/" in date_str:
        parts = date_str.split("/")
        if len(parts) == 3:
            return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"

    if "-" in date_str:
        parts = date_str.split("-")
        if len(parts) == 3:
            if len(parts[0]) == 4:
                return f"{parts[2].zfill(2)}/{parts[1].zfill(2)}/{parts[0]}"
            return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"

    return None
