# nmkgn

Case-based document analysis app for Chilean consumer-credit review.

## Local Ports

This project avoids common workstation defaults because parallel development
happens on the same computer.

| Service | Port | URL |
|---|---:|---|
| React/Vite app | 15179 | `http://127.0.0.1:15179/` |
| Vite production preview | 15180 | `http://127.0.0.1:15180/` |
| FastAPI API | 18080 | `http://127.0.0.1:18080/api/health` |
| PostgreSQL host port | 55432 | `postgresql+psycopg://nmkgn:nmkgn@localhost:55432/nmkgn` |

The durable registry is `.kdbp/PORTS.md`.

## Configuration

Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

Upload storage settings (`NMKGN_UPLOAD_*`) control local document persistence.
Production uploads are disabled by default — see `.env.example` comments.

## Run Locally

```bash
npm run db:up
uv run alembic -c api/migrations/alembic.ini upgrade head
npm run api:dev
npm run dev
```

Run the API and Vite commands in separate terminals.

## Checks

```bash
uv run pytest
npm test
npm run lint
npm run build
```
