"""Sales analysis shared by HTML and PDF uploads."""

import math

from lib.config import DEPOT, PRODUCTS
from lib.numbers import to_int


def get_sale_case_by_product_code(product_code, data):
    if not product_code or not isinstance(data, list):
        return 0
    for item in data:
        if item and item.get("Product Code") == product_code:
            return to_int(item.get("Sale Case"))
    return 0


def truncate_decimal(value, precision=2):
    factor = 10 ** precision

    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0

    if not math.isfinite(number):
        return 0

    if number < 0:
        return math.ceil(number * factor) / factor
    return math.floor(number * factor) / factor


def format_truncated_decimal(value, precision=2):
    return f"{truncate_decimal(value, precision):.{precision}f}"


def calc_percentage(numerator, denominator, precision=2):
    if not denominator:
        return format_truncated_decimal(0, precision)
    return format_truncated_decimal((numerator / denominator) * 100, precision)


def run_sales_analysis(rows, extracted_date, options=None):
    options = options or {}

    def get(code):
        return get_sale_case_by_product_code(code, rows)

    p = PRODUCTS

    depot_name = options.get("depot_name") or DEPOT["name"]
    depot_prefix = options.get("depot_prefix") or DEPOT["prefix"]

    kfl_gbs = get(p["KFL"]["gbs1"]) + get(p["KFL"]["gbs2"])
    kfl_gup = get(p["KFL"]["gup1"]) + get(p["KFL"]["gup2"])
    kfl_total = kfl_gbs + kfl_gup

    kfu_gbs = get(p["KFU"]["gbs"])
    kfu_gup = get(p["KFU"]["gup"])
    kfu_cap = get(p["KFU"]["cap"])
    kfu_total = kfu_gbs + kfu_gup + kfu_cap

    uwt_gbs = get(p["UWT"]["gbs"])
    uwt_gup = get(p["UWT"]["gup"])
    uwt_cap = get(p["UWT"]["cap"])
    uwt_total = uwt_gbs + uwt_gup + uwt_cap

    hnkn_gbs = get(p["HNKN"]["gbs"])
    hnkn_gup = get(p["HNKN"]["gup"])
    hnkn_total = hnkn_gbs + hnkn_gup

    rc_gbs = get(p["RC"]["gbs"])
    gd_gbs = get(p["GD"]["gbs"])

    bud_gbs = get(p["BUD"]["gbs"])
    bud_gup = get(p["BUD"]["gup"])
    bud_cap = get(p["BUD"]["cap"])
    bud_total = bud_gbs + bud_gup + bud_cap

    cbs_gbs = get(p["CBS"]["gbs"])
    cbs_gup = get(p["CBS"]["gup"])
    cbs_cap = get(p["CBS"]["cap"])
    cbs_total = cbs_gbs + cbs_gup + cbs_cap

    tubl_gbs = get(p["TUBL"]["gbs"])
    tubl_gup = get(p["TUBL"]["gup"])
    kjl_gbs = get(p["KJL"]["gbs"])
    corona_gup = get(p["CORONA"]["gup"])
    corona_cap = get(p["CORONA"]["cap"])
    hogden_gup = get(p["HOGDEN"]["gup"])
    hogden_cap = get(p["HOGDEN"]["cap"])
    total1 = kfl_total + kfu_total + uwt_total + hnkn_total + rc_gbs + gd_gbs + bud_total + cbs_total + tubl_gbs + tubl_gup + kjl_gbs + corona_gup + corona_cap + hogden_gup + hogden_cap

    kfs_gbs = get(p["KFS"]["gbs1"]) + get(p["KFS"]["gbs2"])
    kfs_gup = get(p["KFS"]["gup1"]) + get(p["KFS"]["gup2"])
    kfs_total = kfs_gbs + kfs_gup

    kfum_gbs = get(p["KFUM"]["gbs"])
    kfum_gup = get(p["KFUM"]["gup"])
    kfum_cap = get(p["KFUM"]["cap"])
    kfum_total = kfum_gbs + kfum_gup + kfum_cap

    h5000_gbs = get(p["H5000"]["gbs"])
    kout_gbs = get(p["KOUT"]["gbs"])

    budm_gbs = get(p["BUDM"]["gbs"])
    budm_gup = get(p["BUDM"]["gup"])
    budm_cap = get(p["BUDM"]["cap"])
    budm_total = budm_gbs + budm_gup + budm_cap

    cbe_gbs = get(p["CBE"]["gbs"])
    cbe_gup = get(p["CBE"]["gup"])
    cbe_cap = get(p["CBE"]["cap"])
    cbe_total = cbe_gbs + cbe_gup + cbe_cap

    tubs_gbs = get(p["TUBS"]["gbs"])
    tubsc_gbs = get(p["TUBSC"]["gbs"])
    kjs_gbs = get(p["KJS"]["gbs"])
    total2 = kfs_total + kfum_total + h5000_gbs + kout_gbs + budm_total + cbe_total + tubs_gbs + tubsc_gbs + kjs_gbs
    grand_total = total1 + total2

    ub_day_numerator = kfl_total + kfu_total + uwt_total + hnkn_total + kfs_total + kfum_total
    ub_day_percentage = calc_percentage(ub_day_numerator, grand_total)
    huma_day = kfu_total + uwt_total + hnkn_total + kfum_total
    lnd_total = kfu_total + uwt_total + hnkn_total + bud_total + cbs_total + kfum_total + budm_total + cbe_total + tubsc_gbs
    d_ub_ratio = calc_percentage(kfu_total, bud_total)
    d_mm_ratio = calc_percentage(kfum_total, budm_total)
    huma_percentage = calc_percentage(huma_day, lnd_total)

    report_text = (
        f"{depot_prefix}:{depot_name} SALE\n"
        f"DATE: {extracted_date}\n"
        "\n"
        f"KFL: {kfl_gbs}/{kfl_gup}\n"
        f"KFU: {kfu_gbs}/{kfu_gup}/{kfu_cap}\n"
        f"UWT: {uwt_gbs}/{uwt_gup}/{uwt_cap}\n"
        f"HNKN: {hnkn_gbs}/{hnkn_gup}\n"
        f"RC: {rc_gbs}\n"
        f"GD: {gd_gbs}\n"
        f"BUD: {bud_gbs}/{bud_gup}/{bud_cap}\n"
        f"CBS: {cbs_gbs}/{cbs_gup}/{cbs_cap}\n"
        f"TUBL: {tubl_gbs}/{tubl_gup}\n"
        f"KJL: {kjl_gbs}\n"
        "B91L: 0/0/0\n"
        "B91W: 0/0/0\n"
        f"Corona: 0/{corona_gup}/{corona_cap}\n"
        f"Hogden: 0/{hogden_gup}/{hogden_cap}\n"
        f"L.IND: {total1}\n"
        "\n"
        f"KFS: {kfs_gbs}/{kfs_gup}\n"
        f"KFUM: {kfum_gbs}/{kfum_gup}/{kfum_cap}\n"
        f"H5000: {h5000_gbs}\n"
        f"KOUT: {kout_gbs}\n"
        f"BUDM: {budm_gbs}/{budm_gup}/{budm_cap}\n"
        f"CBE: {cbe_gbs}/{cbe_gup}/{cbe_cap}\n"
        f"TUBS: {tubs_gbs}\n"
        f"TUBSC: {tubsc_gbs}\n"
        f"KJS: {kjs_gbs}\n"
        "B91G: 0/0/0\n"
        "B91R: 0/0/0\n"
        f"S.IND: {total2}\n"
        "\n"
        f"INDDay/Cum: {grand_total}/Empty\n"
        f"UBDay: {ub_day_numerator}/{ub_day_percentage}%\n"
        "UBCum: Empty/%\n"
        "\n"
        "HUMA\n"
        f"Day: {huma_day}/{huma_percentage}%\n"
        "Cum: Empty/ %\n"
        f"lND: {lnd_total}/Empty\n"
        "\n"
        f"D-U/B: [{kfu_total}/{bud_total}] = {d_ub_ratio}%\n"
        "Cu U/B: [Empty/Empty] = %\n"
        f"D-M/M: [{kfum_total}/{budm_total}] = {d_mm_ratio}%\n"
        "Cum M/M: [Empty/Empty] = %\n"
    )

    return {
        "date": extracted_date,
        "totals": {
            "l_ind": total1,
            "s_ind": total2,
            "grand_total": grand_total,
            "ub_day": ub_day_numerator,
            "ub_day_percentage": ub_day_percentage,
            "huma_day": huma_day,
            "huma_percentage": huma_percentage,
            "lnd_total": lnd_total,
            "d_ub_ratio": d_ub_ratio,
            "d_mm_ratio": d_mm_ratio,
        },
        "report_text": report_text,
    }
