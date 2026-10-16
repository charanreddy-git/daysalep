# DaySale

Single Python (Flask) app. HTM/HTML reports are parsed with BeautifulSoup, PDFs
with pdfplumber, and both return the same normalized JSON for the browser UI in
`public/`.

## Structure

```text
daysale/
├── application.py     # Flask entrypoint (Elastic Beanstalk / gunicorn compatible)
├── lib/
│   ├── config.py      # product codes and depot info
│   ├── date.py        # date helpers
│   ├── errors.py      # ParserError with HTTP status
│   ├── file_type.py   # upload type detection (extension, MIME, %PDF- magic)
│   ├── html_parser.py # HTML parsing + date/depot extraction
│   ├── numbers.py     # JS-style number parsing helpers
│   ├── parse.py       # upload dispatch -> normalized result
│   ├── pdf_parser.py  # PDF row extraction with pdfplumber
│   ├── result.py      # normalized response assembly
│   ├── sales.py       # sales analysis / report text
│   ├── stock.py       # opening balance analysis / report text
│   ├── cheers.py      # CHEERS analysis / report text
│   ├── logger.py      # JSON request logging
│   └── ratelimit.py   # in-memory per-client rate limiting
├── public/            # UI (index.html, styles.css, ui.js, api.js, script.js)
├── requirements.txt
├── Dockerfile
└── Procfile
```

The UI is plain browser JavaScript and needs no build step.

## Request Flow

```text
POST /api/parse
  |
  +--> .htm / .html -> lib/html_parser.py
  |
  +--> .pdf        -> lib/pdf_parser.py
  |
  v
Normalized JSON (rows + sales/stock/cheers reports)
  |
  v
UI renders sales and stock output
```

## Run Locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python application.py
```

This starts the app on `http://127.0.0.1:2323`. Upload `.htm`, `.html`, or
`.pdf` files through the UI.

## Deploy

```bash
gunicorn application:application --bind :8000
```

`Procfile` and `Dockerfile` are provided for Elastic Beanstalk / App Runner /
ECS style deployments.

## Environment Variables

- `PORT` — listen port (default `2323`; most platforms set this)
- `DEPOT_NAME` — default depot name (default `MDCL-2`)
- `DEPOT_PREFIX` — report prefix (default `Depot`)
- `PARSE_TIMEOUT_MS` — parse timeout (default `50000`)
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` — rate limiting (default `60000` / `30`)

## Endpoints

- `POST /api/parse` — multipart upload with field `file`; returns
  `{ "success": true, "result": { ... } }`
- `GET /api/test`, `GET /healthz` — health checks
- `GET /*` — serves the UI from `public/`

## Where To Change Things

- HTML parsing or date/depot extraction: `lib/html_parser.py`
- PDF extraction accuracy: `lib/pdf_parser.py`
- Calculations or report text: `lib/sales.py`, `lib/stock.py`, `lib/cheers.py`
- Product codes / depot info: `lib/config.py`

## Notes

- The UI does not know whether the source file was HTML or PDF.
- PDF parsing expects selectable text. OCR can be added later inside
  `lib/pdf_parser.py` without affecting the UI or the API.
- HTM and PDF uploads are parsed in-process; the previous Node.js + Python
  split backend has been removed.
# daysale-render
# daysale-render
