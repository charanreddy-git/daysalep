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

The app is deployed on Vercel. To redo it or fork it: push the repo to GitHub,
then in Vercel **Add New → Project → import the repo**. No build command or
other settings needed — Vercel detects Flask from `requirements.txt` and loads
the app from `wsgi.py`.

- `wsgi.py` is a one-line shim (`from application import app`). Vercel only
  loads `app.py`, `index.py`, `server.py`, `main.py`, `wsgi.py`, or `asgi.py`,
  so it would otherwise fail with `FLASK_ENTRYPOINT_NOT_FOUND` on
  `application.py`.
- Files in `public/` are served from the CDN; every other path goes to Flask.
- The function can run for up to 300 s by default, well above the 50 s parse timeout.
- Requests bigger than **4.5 MB** are refused by Vercel before they reach the
  app — see [Good to know](#good-to-know).

## Deploy on Render (alternative)

`render.yaml` is still in the repo, so the old Render path keeps working:
**New → Blueprint → select your repo**, and Render sets up the service, health
check, and env vars automatically.

By hand, create a **Web Service** with:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn application:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Health check path | `/healthz` |

Free instances sleep after a few idle minutes, so the first request wakes them
up and takes ~30 seconds. Paid instances stay warm.

## Settings

Set them in Vercel's **Settings → Environment Variables** (or Render's
**Environment** tab). Every one is optional: the code falls back to the
defaults below, and `render.yaml` sets them explicitly for Render only — on
Vercel nothing sets them for you.

| Variable | What it does | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | set by the host |
| `DEPOT_NAME` | Depot shown in reports | `MDCL-2` |
| `DEPOT_PREFIX` | Report prefix | `Depot` |
| `PARSE_TIMEOUT_MS` | Give up on a parse after this long | `50000` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Requests allowed per window | `60000` / `30` |

## API

- `POST /api/parse` — send a file as multipart field `file`, get `{ "success": true, "result": { ... } }` back
- `GET /healthz` (or `/api/test`) — health check
- `GET /*` — serves the UI from `public/` (from Vercel's CDN when deployed there)

## Project layout

```text
daysale/
├── application.py   # Flask routes
├── wsgi.py          # entrypoint shim — what Vercel loads
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
- Uploads are capped at 10 MB in code, but Vercel rejects request bodies over **4.5 MB** (`413 FUNCTION_PAYLOAD_TOO_LARGE`) before the app sees them. Render has no such limit, so big PDFs may work there and fail on Vercel.
- The rate limit is counted in memory per process, so on Vercel each function instance keeps its own counter.
