"""Shared stock (opening balance) analysis (port of lib/stock.js)."""

from typing import Dict, List, Optional

from lib.config import DEPOT, PRODUCTS
from lib.date import get_next_day_date
from lib.numbers import to_int
from lib.sales import calc_percentage


def get_closing_stock_by_product_code(product_code: str, data: List[Dict[str, object]]) -> int:
    if not product_code or not isinstance(data, list):
        return 0
    for item in data:
        if not isinstance(item, dict):
            continue
        if item.get("Product Code") == product_code:
            return to_int(item.get("Closing Stock"))
    return 0


def run_opening_balance_analysis(rows: List[Dict[str, object]], extracted_date: str, options: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    options = options or {}

    def get(code: str) -> int:
        return get_closing_stock_by_product_code(code, rows)

    p = PRODUCTS
    next_day_date = get_next_day_date(extracted_date)
    depot_name = options.get("depot_name") or DEPOT["name"]

    kfl_gbs = get(p["KFL"]["gbs1"]) + get(p["KFL"]["gbs2"])
    kfl_gup = get(p["KFL"]["gup1"]) + get(p["KFL"]["gup2"])
    kfs_gbs = get(p["KFS"]["gbs1"]) + get(p["KFS"]["gbs2"])
    kfs_gup = get(p["KFS"]["gup1"]) + get(p["KFS"]["gup2"])
    kfu_gbs = get(p["KFU"]["gbs"])
    kfu_gup = get(p["KFU"]["gup"])
    kfu_cap = get(p["KFU"]["cap"])
    uwt_gbs = get(p["UWT"]["gbs"])
    uwt_gup = get(p["UWT"]["gup"])
    uwt_cap = get(p["UWT"]["cap"])
    kfum_gbs = get(p["KFUM"]["gbs"])
    kfum_gup = get(p["KFUM"]["gup"])
    kfum_cap = get(p["KFUM"]["cap"])
    hnk_gbs = get(p["HNKN"]["gbs"])
    hnk_gup = get(p["HNKN"]["gup"])
    rc_gbs = get(p["RC"]["gbs"])
    gd_gbs = get(p["GD"]["gbs"])
    h5_gbs = get(p["H5000"]["gbs"])
    ko_gbs = get(p["KOUT"]["gbs"])
    bud_gbs = get(p["BUD"]["gbs"])
    bud_gup = get(p["BUD"]["gup"])
    bud_cap = get(p["BUD"]["cap"])
    budm_gbs = get(p["BUDM"]["gbs"])
    budm_gup = get(p["BUDM"]["gup"])
    budm_cap = get(p["BUDM"]["cap"])
    cor_gup = get(p["CORONA"]["gup"])
    hd_gup = get(p["HOGDEN"]["gup"])
    hd_cap = get(p["HOGDEN"]["cap"])
    cl_gbs = get(p["CBS"]["gbs"])
    cl_gup = get(p["CBS"]["gup"])
    cl_cap = get(p["CBS"]["cap"])
    tubl_gbs = get(p["TUBL"]["gbs"])
    tubl_gup = get(p["TUBL"]["gup"])
    cle_gbs = get(p["CBE"]["gbs"])
    cle_gup = get(p["CBE"]["gup"])
    cle_cap = get(p["CBE"]["cap"])
    tubs_gbs = get(p["TUBS"]["gbs"])
    tubsc_gbs = get(p["TUBSC"]["gbs"])
    kjs_gbs = get(p["KJS"]["gbs"])
    kjl_gbs = get(p["KJL"]["gbs"])

    total_gbs = kfl_gbs + kfs_gbs + kfu_gbs + uwt_gbs + kfum_gbs + hnk_gbs + rc_gbs + gd_gbs + h5_gbs + ko_gbs + bud_gbs + budm_gbs + cl_gbs + tubl_gbs + cle_gbs + tubs_gbs + tubsc_gbs + kjl_gbs + kjs_gbs
    total_gup = kfl_gup + kfs_gup + kfu_gup + uwt_gup + kfum_gup + hnk_gup + bud_gup + budm_gup + cl_gup + tubl_gup + cle_gup + cor_gup + hd_gup
    total_cap = kfu_cap + uwt_cap + bud_cap + budm_cap + cl_cap + cle_cap + kfum_cap + hd_cap
    opening_balance_total = total_gbs + total_gup + total_cap
    ub_total = kfl_gbs + kfl_gup + kfs_gbs + kfs_gup + kfu_gbs + kfu_gup + kfu_cap + uwt_gbs + uwt_gup + uwt_cap + kfum_gbs + kfum_gup + kfum_cap + hnk_gbs + hnk_gup
    ub_percentage = calc_percentage(ub_total, opening_balance_total)

    report_text = f"""OB+(VEH)
Date: {next_day_date}
Depot: {depot_name}

KFL: {kfl_gbs}/{kfl_gup}
KFS: {kfs_gbs}/{kfs_gup}
KFU: {kfu_gbs}/{kfu_gup}/{kfu_cap}
U wt: {uwt_gbs}/{uwt_gup}/{uwt_cap}
KFUM: {kfum_gbs}/{kfum_gup}/{kfum_cap}
HNK: {hnk_gbs}/{hnk_gup}

RC: {rc_gbs}
GD: {gd_gbs}
H5: {h5_gbs}
KO: {ko_gbs}
BUD: {bud_gbs}/{bud_gup}/{bud_cap}
BUDM: {budm_gbs}/{budm_gup}/{budm_cap}
Cor: {cor_gup}
HD: {hd_gup}/{hd_cap}

CL: {cl_gbs}/{cl_gup}/{cl_cap}
TUBL: {tubl_gbs}/{tubl_gup}
CLE: {cle_gbs}/{cle_gup}/{cle_cap}
TUBS: {tubs_gbs}
TUBSC: {tubsc_gbs}
KJL: {kjl_gbs}
KJS: {kjs_gbs}
B91L: 00/00/00
B91W: 00/00/00
B91G: 00
B91R: 00

UB/Total - {ub_total}/{opening_balance_total} = {ub_percentage}%

Today Unloading Plan -
Total Pending Veh -
KFL -
KFS -
KFU -
""".strip()

    return {
        "date": next_day_date,
        "totals": {
            "ub_total": ub_total,
            "opening_balance_total": opening_balance_total,
            "ub_percentage": ub_percentage,
            "total_gbs": total_gbs,
            "total_gup": total_gup,
            "total_cap": total_cap,
        },
        "report_text": report_text,
    }
