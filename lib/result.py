"""Normalized response building (port of lib/result.js)."""

from typing import Dict, List, Optional

from lib.cheers import run_cheers_opening_balance_analysis, run_cheers_sales_analysis
from lib.date import get_today_date
from lib.sales import run_sales_analysis
from lib.stock import run_opening_balance_analysis


def build_result(rows: List[Dict[str, object]], extracted_date: str, metadata: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    metadata = metadata or {}
    normalized_rows = rows if isinstance(rows, list) else []
    normalized_date = extracted_date or get_today_date()

    depot = metadata.get("depot") or None
    depot_name = None
    if depot:
        depot_name = depot.get("raw") or depot.get("code")
    depot_prefix = metadata.get("depot_prefix")

    return {
        "sourceType": metadata.get("source_type") or "unknown",
        "input": {
            "filename": metadata.get("filename") or "",
            "mimeType": metadata.get("mime_type") or "",
        },
        "depot": depot,
        "conversion": {
            "rowsProcessed": len(normalized_rows),
            "extractedDate": normalized_date,
        },
        "rows": normalized_rows,
        "sales": run_sales_analysis(normalized_rows, normalized_date, {"depot_name": depot_name, "depot_prefix": depot_prefix}),
        "stock": run_opening_balance_analysis(normalized_rows, normalized_date, {"depot_name": depot_name}),
        "cheers_sales": run_cheers_sales_analysis(normalized_rows, normalized_date, {"depot_name": depot_name, "depot_prefix": depot_prefix}),
        "cheers_stock": run_cheers_opening_balance_analysis(normalized_rows, normalized_date, {"depot_name": depot_name}),
    }
