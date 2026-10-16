"""HTML report parsing with BeautifulSoup."""

import re

from bs4 import BeautifulSoup

from lib.date import get_today_date, parse_date_string
from lib.errors import create_parser_error
from lib.numbers import to_number

_HEADER_MARKERS = ("slno", "sl.no", "sl no")
_DEPOT_PATTERNS = [
    re.compile(r"IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)", re.IGNORECASE),
    re.compile(r"IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)(?:\s|$)", re.IGNORECASE),
    re.compile(r"IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)", re.IGNORECASE),
    re.compile(r"IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)(?:\s|$)", re.IGNORECASE),
]
_DATE_PATTERNS = (
    r"(\d{1,2}-[A-Za-z]{3}-\d{4})",
    r"(\d{1,2}/\d{1,2}/\d{4})",
    r"(\d{1,2}-\d{1,2}-\d{4})",
    r"(\d{4}-\d{1,2}-\d{1,2})",
)
_TIME_PATTERN = re.compile(r"(\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM))", re.IGNORECASE)


def _has_header_marker(text):
    lowered = (text or "").lower()
    return any(marker in lowered for marker in _HEADER_MARKERS)


def extract_depot_from_text(text):
    raw_text = str(text or "").replace("\u00a0", " ")
    if not raw_text:
        return None

    location_part = ""
    suffix_part = ""

    for pattern in _DEPOT_PATTERNS:
        match = pattern.search(raw_text)
        if not match:
            continue
        location_part = str(match.group(1) or "").strip()
        groups = match.groups()
        if len(groups) > 1:
            suffix_part = str(groups[1] or "").strip()
        break

    if not location_part:
        return None

    location_token = (location_part.split() or [""])[-1]
    suffix = f"-{suffix_part.upper()}" if suffix_part else ""
    raw = f"{location_token}{suffix}"
    if not raw:
        return None

    return {
        "location": location_token,
        "suffix": suffix,
        "raw": raw,
        "code": raw,
    }


def extract_depot_from_html(html):
    if not html or not isinstance(html, str):
        return None
    soup = BeautifulSoup(html, "html.parser")
    return extract_depot_from_text(soup.get_text() or "")


def extract_date_from_html(html):
    if not html or not isinstance(html, str):
        return get_today_date()

    soup = BeautifulSoup(html, "html.parser")
    date_text = ""

    for element in soup.find_all(True):
        text = element.get_text()
        if "date:" in text.lower():
            date_text = text
            break

    if not date_text:
        return get_today_date()

    date_text = _TIME_PATTERN.sub("", date_text).strip()

    for pattern in _DATE_PATTERNS:
        match = re.search(pattern, date_text)
        if not match:
            continue
        parsed = parse_date_string(match.group(1))
        if parsed:
            return parsed

    return get_today_date()


def parse_html_rows(html):
    soup = BeautifulSoup(html, "html.parser")
    target_table = None

    for table in soup.find_all("table"):
        first_cell = table.find(["th", "td"])
        first_text = first_cell.get_text() if first_cell else ""
        if _has_header_marker(first_text):
            target_table = table
            break

    if target_table is None:
        raise create_parser_error('Table with "Slno" header not found. Please upload a valid sales table.')

    rows = []
    header_found = False
    for row in target_table.find_all("tr"):
        cells = row.find_all(["th", "td"])

        if not header_found:
            first_cell = cells[0].get_text().lower().strip() if cells else ""
            if _has_header_marker(first_cell):
                header_found = True
            continue

        if len(cells) < 9:
            continue

        row_data = {
            "Slno": cells[0].get_text().strip(),
            "Product Code": cells[1].get_text().strip(),
            "Item Description": cells[2].get_text().strip(),
            "Opening Stock": to_number(cells[3].get_text()),
            "Received Stock": to_number(cells[4].get_text()),
            "Sale Case": to_number(cells[5].get_text()),
            "Sale Btls.": to_number(cells[6].get_text()),
            "Sale Amount": to_number(cells[7].get_text()),
            "Closing Stock": to_number(cells[8].get_text()),
        }

        if row_data["Product Code"]:
            rows.append(row_data)

    return rows
