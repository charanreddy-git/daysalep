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

## Deploy on Render

Push the repo to GitHub, then in Render:

**New → Blueprint → select your repo.** Render reads `render.yaml` and sets up
the service, health check, and env vars automatically. Done.

Prefer doing it by hand? Create a **Web Service** with:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn application:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Health check path | `/healthz` |

Heads up: free instances sleep after a few idle minutes, so the first request
wakes them up and takes ~30 seconds. Paid instances stay warm.

## Settings

Set them in Render's **Environment** tab (`render.yaml` already sets the
defaults shown here):

| Variable | What it does | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | set by Render |
| `DEPOT_NAME` | Depot shown in reports | `MDCL-2` |
| `DEPOT_PREFIX` | Report prefix | `Depot` |
| `PARSE_TIMEOUT_MS` | Give up on a parse after this long | `50000` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Requests allowed per window | `60000` / `30` |

## API

- `POST /api/parse` — send a file as multipart field `file`, get `{ "success": true, "result": { ... } }` back
- `GET /healthz` (or `/api/test`) — health check
- `GET /*` — serves the UI from `public/`

## Project layout

```text
daysale/
├── application.py   # Flask routes
├── render.yaml      # Render service definition
├── lib/
│   ├── parse.py     # picks the right parser
│   ├── html_parser.py
│   ├── pdf_parser.py
│   ├── sales.py     # Today Sale numbers
│   ├── stock.py     # Opening Balance numbers
│   ├── cheers.py    # CHEERS numbers
│   └── config.py    # product codes and depot info
└── public/          # index.html, styles.css, ui.js, api.js, script.js
```

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
- Uploads are capped at 10 MB.
