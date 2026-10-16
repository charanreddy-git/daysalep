"""PDF row extraction with pdfplumber (same logic as the previous parser)."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import pdfplumber


Row = Dict[str, object]

PRODUCT_CODE_RE = re.compile(r"^[A-Z0-9-]{6,}$")
NUMBER_RE = re.compile(r"^-?\d[\d,]*(?:\.\d+)?$")
STOCK_RE = re.compile(r"^-?\d[\d,]*(?:\.\d+)?/-?\d[\d,]*(?:\.\d+)?$")

DEPOT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)", re.IGNORECASE),
    re.compile(r"IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)", re.IGNORECASE),
    re.compile(r"IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)", re.IGNORECASE),
    re.compile(r"IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)", re.IGNORECASE),
]


def _stock_to_float(value: str) -> float:
    text = str(value or "").strip()
    if not text:
        return 0.0
    try:
        return float(text.split("/", 1)[0].strip().replace(",", ""))
    except ValueError:
        return 0.0


def _to_float(value: str) -> float:
    text = str(value or "").strip().replace(",", "")
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def _clean_cell(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ")).strip()


def _extract_depot(text: str) -> Optional[Dict[str, str]]:
    raw_text = str(text or "").replace("\u00a0", " ")
    if not raw_text:
        return None

    location_part = ""
    suffix_part = ""

    for pattern in DEPOT_PATTERNS:
        match = pattern.search(raw_text)
        if not match:
            continue
        location_part = str(match.group(1) or "").strip()
        if match.lastindex and match.lastindex >= 2:
            suffix_part = str(match.group(2) or "").strip()
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


def _parse_line_to_row(line: str) -> Optional[Row]:
    cleaned = re.sub(r"\s+", " ", line.strip())
    if not cleaned:
        return None

    lowered = cleaned.lower()
    if "product code" in lowered or "opening stock" in lowered or "closing stock" in lowered:
        return None

    parts = cleaned.split(" ")
    if len(parts) < 7 or not parts[0].isdigit():
        return None

    code_index = -1
    for idx in range(1, min(4, len(parts))):
        if PRODUCT_CODE_RE.match(parts[idx]):
            code_index = idx
            break
    if code_index == -1 or len(parts) <= code_index + 5:
        return None

    tail = parts[code_index + 1 :]
    if len(tail) < 5:
        return None

    closing_token = tail[-1]
    sale_amount_token = tail[-2]
    sale_btls_token = tail[-3]
    sale_case_token = tail[-4]
    opening_token = tail[-5]
    description_tokens = tail[:-5]

    if not STOCK_RE.match(opening_token) or not STOCK_RE.match(closing_token):
        return None
    if not NUMBER_RE.match(sale_case_token) or not NUMBER_RE.match(sale_btls_token) or not NUMBER_RE.match(sale_amount_token):
        return None

    return {
        "Slno": parts[0],
        "Product Code": parts[code_index],
        "Item Description": " ".join(description_tokens).strip(),
        "Opening Stock": _stock_to_float(opening_token),
        "Received Stock": 0.0,
        "Sale Case": _to_float(sale_case_token),
        "Sale Btls.": _to_float(sale_btls_token),
        "Sale Amount": _to_float(sale_amount_token),
        "Closing Stock": _stock_to_float(closing_token),
    }


def _dedupe_rows(rows: Iterable[Row]) -> List[Row]:
    deduped: List[Row] = []
    seen: set[Tuple[str, str, float, float, float, float, float]] = set()
    for row in rows:
        key = (
            str(row.get("Slno", "")),
            str(row.get("Product Code", "")),
            float(row.get("Opening Stock", 0.0)),
            float(row.get("Sale Case", 0.0)),
            float(row.get("Sale Btls.", 0.0)),
            float(row.get("Sale Amount", 0.0)),
            float(row.get("Closing Stock", 0.0)),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    return deduped


def _parse_tables(page: pdfplumber.page.Page) -> List[Row]:
    rows: List[Row] = []
    for table in page.extract_tables(
        table_settings={
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "intersection_tolerance": 5,
            "snap_tolerance": 3,
        }
    ) or []:
        for raw_cells in table:
            merged = " ".join(cell for cell in (_clean_cell(value) for value in (raw_cells or [])) if cell)
            parsed = _parse_line_to_row(merged)
            if parsed:
                rows.append(parsed)
    return rows


def _parse_text(text: str) -> List[Row]:
    return [row for row in (_parse_line_to_row(line) for line in text.split("\n")) if row]


def _extract_date(text: str) -> str:
    months = {
        "jan": "01",
        "feb": "02",
        "mar": "03",
        "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "aug": "08",
        "sep": "09",
        "oct": "10",
        "nov": "11",
        "dec": "12",
    }
    patterns = [
        (re.compile(r"(\d{1,2})-([A-Za-z]{3})-(\d{4})"), "month_name"),
        (re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})"), "slash"),
        (re.compile(r"(\d{4})-(\d{1,2})-(\d{1,2})"), "iso"),
        (re.compile(r"(\d{1,2})-(\d{1,2})-(\d{4})"), "dash"),
    ]

    for regex, kind in patterns:
        match = regex.search(text)
        if not match:
            continue
        if kind == "month_name":
            day, month_name, year = match.groups()
            return f"{int(day):02d}/{months.get(month_name.lower(), '01')}/{year}"
        if kind == "slash":
            day, month, year = match.groups()
            return f"{int(day):02d}/{int(month):02d}/{year}"
        if kind == "iso":
            year, month, day = match.groups()
            return f"{int(day):02d}/{int(month):02d}/{year}"
        day, month, year = match.groups()
        return f"{int(day):02d}/{int(month):02d}/{year}"
    return ""


def parse_pdf(pdf_path: str) -> Dict[str, object]:
    source = Path(pdf_path)
    rows: List[Row] = []
    extracted_date = ""
    depot: Optional[Dict[str, str]] = None

    with pdfplumber.open(source) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if not extracted_date:
                extracted_date = _extract_date(text)
            if depot is None:
                depot = _extract_depot(text)
            rows.extend(_parse_tables(page))
            rows.extend(_parse_text(text))

    deduped_rows = _dedupe_rows(rows)
    return {
        "rows": deduped_rows,
        "extractedDate": extracted_date,
        "rowsProcessed": len(deduped_rows),
        "depot": depot,
    }
