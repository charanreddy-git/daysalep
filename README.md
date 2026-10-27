# DaySale

Upload a daily sales report (`.htm`, `.html`, or `.pdf`) and get back clean,
ready-to-copy numbers: **Today Sale**, **Opening Balance**, and the **CHEERS**
breakdowns.

One Flask app does everything — no separate backend, no build step for the UI.

## Run it

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python application.py
```

Open <http://127.0.0.1:2323> and drop in a report file.

## Deploy on Vercel

Vercel detects the Flask app from `wsgi.py` and installs dependencies from
`requirements.txt`. Import the repo in Vercel and deploy — no build command or
extra settings are needed.

- Files in `public/` are served from Vercel's CDN; Flask handles `/api/*` and the health check.
- Vercel rejects request bodies over **4.5 MB** before they reach the app, so the UI and Flask both cap uploads at 4.5 MB.
- Set optional environment variables in **Project Settings → Environment Variables**.

## API

- `POST /api/parse` — send a file as multipart field `file`, get `{ "success": true, "result": { ... } }` back
- `GET /healthz` (or `/api/test`) — health check
- `GET /*` — serves the UI from `public/`

## Settings

All optional — each one falls back to the default shown:

| Variable | What it does | Default |
| --- | --- | --- |
| `DEPOT_NAME` | Depot shown in reports | `MDCL-2` |
| `DEPOT_PREFIX` | Report prefix | `Depot` |
| `PARSE_TIMEOUT_MS` | Give up on a parse after this long | `50000` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Requests allowed per window | `60000` / `30` |

## Project layout

```text
daysale/
├── application.py   # Flask routes
├── wsgi.py          # Vercel entrypoint
├── lib/
│   ├── parse.py     # picks the right parser
│   ├── html_parser.py
│   ├── pdf_parser.py
│   ├── sales.py     # Today Sale numbers
│   ├── stock.py     # Opening Balance numbers
│   ├── cheers.py    # CHEERS numbers
│   └── config.py    # product codes and depot info
├── public/          # index.html, styles.css, ui.js, api.js, script.js, favicon.svg
└── tests/           # Playwright regression tests and fixtures
```

## Tests

The browser regression suite covers upload, report tabs, copy, product search,
the product table, errors, and mobile layout.

```bash
npm install
npx playwright install chromium
npm test
```

The tests start the Flask app on port `4323` with a higher rate limit and use
the fixtures in `tests/fixtures/`. To watch the tests run, use
`npm run test:headed`.

## Making changes

| You want to change... | Edit |
| --- | --- |
| How HTML reports are read | `lib/html_parser.py` |
| How PDF reports are read | `lib/pdf_parser.py` |
| The numbers or report wording | `lib/sales.py`, `lib/stock.py`, `lib/cheers.py` |
| Product codes or depot info | `lib/config.py` |

## Good to know

- The UI doesn't care whether the file came in as HTML or PDF — both produce the same result shape.
- PDFs need selectable text. OCR could be added inside `lib/pdf_parser.py` later without touching the UI.
- Uploads are capped at 4.5 MB in both the UI and Flask to match Vercel's request-body limit.
- Static asset links in `public/index.html` carry a `?v=` query. Bump it after changing any file in `public/` so browsers and the CDN pick up the new version.
- The rate limit is counted in memory, so it applies per process; on Vercel, each function instance keeps its own counter.
