"""Shared CHEERS analysis (port of lib/cheers.js)."""

from typing import Dict, List, Optional

from lib.config import CHEERS_PRODUCTS, DEPOT
from lib.date import get_next_day_date
from lib.numbers import to_int


def get_values_by_codes(codes: List[str], data: List[Dict[str, object]], field: str) -> List[int]:
    if not isinstance(codes, list) or not isinstance(data, list):
        return [0 for _ in codes]
    values = []
    for code in codes:
        value = 0
        for item in data:
            if not isinstance(item, dict):
                continue
            if item.get("Product Code") == code:
                value = to_int(item.get(field))
                break
        values.append(value)
    return values


def format_values(values: List[int]) -> str:
    return "-".join(str(value) for value in values)


def sum_values(values: List[int]) -> int:
    return sum(values)


def run_cheers_sales_analysis(rows: List[Dict[str, object]], extracted_date: str, options: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    options = options or {}
    depot_name = options.get("depot_name") or DEPOT["name"]
    depot_prefix = options.get("depot_prefix") or DEPOT["prefix"]
    p = CHEERS_PRODUCTS

    kdm = get_values_by_codes(p["KDM"]["codes"], rows, "Sale Case")
    mnky = get_values_by_codes(p["3MNKY"]["codes"], rows, "Sale Case")
    fww = get_values_by_codes(p["FWW"]["codes"], rows, "Sale Case")
    ggins = get_values_by_codes(p["GGINS"]["codes"], rows, "Sale Case")
    malt = get_values_by_codes(p["MALT"]["codes"], rows, "Sale Case")
    svat = get_values_by_codes(p["SVAT"]["codes"], rows, "Sale Case")
    dman = get_values_by_codes(p["DMAN"]["codes"], rows, "Sale Case")
    stgg = get_values_by_codes(p["STGG"]["codes"], rows, "Sale Case")
    sgxo = get_values_by_codes(p["SGXO"]["codes"], rows, "Sale Case")
    rcw = get_values_by_codes(p["RCW"]["codes"], rows, "Sale Case")
    plyg = get_values_by_codes(p["PLYG"]["codes"], rows, "Sale Case")

    total = (sum_values(kdm) + sum_values(mnky) + sum_values(fww) + sum_values(ggins) +
             sum_values(malt) + sum_values(svat) + sum_values(dman) + sum_values(stgg) +
             sum_values(sgxo) + sum_values(rcw) + sum_values(plyg))

    report_text = f"""{depot_prefix}:{depot_name} SALE
DATE: {extracted_date}

KDM: {format_values(kdm)}
3MNKY: {format_values(mnky)}
FWW: {format_values(fww)}
GGINS: {format_values(ggins)}
MALT: {format_values(malt)}
SVAT: {format_values(svat)}
DMAN: {format_values(dman)}
STGG: {format_values(stgg)}
SGXO: {format_values(sgxo)}
RCW: {format_values(rcw)}
PLYG: {format_values(plyg)}

TOTAL: {total}
"""

    return {
        "date": extracted_date,
        "totals": {"total": total},
        "report_text": report_text,
    }


def run_cheers_opening_balance_analysis(rows: List[Dict[str, object]], extracted_date: str, options: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    options = options or {}
    depot_name = options.get("depot_name") or DEPOT["name"]
    next_day_date = get_next_day_date(extracted_date)
    p = CHEERS_PRODUCTS

    kdm = get_values_by_codes(p["KDM"]["codes"], rows, "Closing Stock")
    mnky = get_values_by_codes(p["3MNKY"]["codes"], rows, "Closing Stock")
    fww = get_values_by_codes(p["FWW"]["codes"], rows, "Closing Stock")
    ggins = get_values_by_codes(p["GGINS"]["codes"], rows, "Closing Stock")
    malt = get_values_by_codes(p["MALT"]["codes"], rows, "Closing Stock")
    svat = get_values_by_codes(p["SVAT"]["codes"], rows, "Closing Stock")
    dman = get_values_by_codes(p["DMAN"]["codes"], rows, "Closing Stock")
    stgg = get_values_by_codes(p["STGG"]["codes"], rows, "Closing Stock")
    sgxo = get_values_by_codes(p["SGXO"]["codes"], rows, "Closing Stock")
    rcw = get_values_by_codes(p["RCW"]["codes"], rows, "Closing Stock")
    plyg = get_values_by_codes(p["PLYG"]["codes"], rows, "Closing Stock")

    total = (sum_values(kdm) + sum_values(mnky) + sum_values(fww) + sum_values(ggins) +
             sum_values(malt) + sum_values(svat) + sum_values(dman) + sum_values(stgg) +
             sum_values(sgxo) + sum_values(rcw) + sum_values(plyg))

    report_text = f"""OB+(VEH)
Date: {next_day_date}
Depot: {depot_name}

KDM: {format_values(kdm)}
3MNKY: {format_values(mnky)}
FWW: {format_values(fww)}
GGINS: {format_values(ggins)}
MALT: {format_values(malt)}
SVAT: {format_values(svat)}
DMAN: {format_values(dman)}
STGG: {format_values(stgg)}
SGXO: {format_values(sgxo)}
RCW: {format_values(rcw)}
PLYG: {format_values(plyg)}

TOTAL: {total}
"""

    return {
        "date": next_day_date,
        "totals": {"total": total},
        "report_text": report_text,
    }
