# SiteSight

SiteSight is an AI-assisted 5S workplace review product. This repository is a
monorepo containing the existing Next.js experience and the Flask API that will
power media ingestion, analysis jobs, findings, and review workflows.

## Repository layout

```text
5S/
├── frontend/       Next.js web application
├── app/            Flask API
├── package.json    Monorepo commands
└── README.md
```

The previous frontend support directories (`build`, `db`, `drizzle`, `worker`,
and their configuration) live under `frontend/` so the current application
continues to build without losing any starter capabilities.

## Prerequisites

- Node.js 22
- Python 3.11 or newer
- A locally installed and signed-in Codex command-line tool for image inspection

## Install

Install frontend and root workspace dependencies:

```bash
npm install
```

Create a Python environment and install the API dependencies.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r app\requirements.txt
```

macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r app/requirements.txt
```

## Run locally

With the Python environment active, start both applications:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:5000
- Health check: http://localhost:5000/api/health

Uploaded images are stored by the Flask service under `app/data/uploads/` and
indexed in `app/data/sitesight.sqlite3`. The frontend creates a stable
`sitesight_user_id` in browser local storage and sends it with upload and history
requests so each browser sees its own image strip.

Current media endpoints:

- `POST /api/inspections`
- `POST /api/uploads`
- `GET /api/uploads?user_id=...`
- `GET /api/uploads/{upload_id}/image?user_id=...`

The browser ID provides local ownership separation for development. It is not a
replacement for authenticated user identity in production.

An inspection creates a reduced review copy of the image, requests one
schema-validated 5S result from the local Codex process, and stores that result
with the original upload. Inspection requests use rolling one-hour limits of 10
per browser identity and 30 across the service. The review copy is temporary and
is removed after each request.

They can also be run separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## Useful commands

```bash
npm run build          # production Next.js build
npm run lint           # frontend lint
npm test               # frontend and Flask tests
```

## Environment

Copy `frontend/.env.example` to `frontend/.env.local` when the frontend needs a
different API URL. Copy `app/.env.example` into your preferred local environment
manager or export the variables before starting Flask.

## Deployment note

The current Vercel configuration now lives in `frontend/vercel.json`. Set the
Vercel project Root Directory to `frontend`. The Flask service can be deployed
independently on a host where the Codex command-line tool is installed and
authenticated. Vercel only hosts the frontend in this setup.
