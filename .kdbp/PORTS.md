# Local Port Registry

Reserved for this project on this workstation.

| Service | Port | URL / DSN | Owner | Notes |
|---|---:|---|---|---|
| React/Vite web app | 15179 | `http://127.0.0.1:15179/` | nmkgn | `npm run dev` |
| Vite production preview | 15180 | `http://127.0.0.1:15180/` | nmkgn | `npm run preview` |
| FastAPI API | 18080 | `http://127.0.0.1:18080/api/health` | nmkgn | `npm run api:dev` |
| PostgreSQL host port | 55432 | `postgresql+psycopg://nmkgn:nmkgn@localhost:55432/nmkgn` | nmkgn | `npm run db:up`; container listens on `5432` internally |

## Rules

- Do not use default local ports `5173`, `8000`, or `5432` for nmkgn dev.
- Update this file, `package.json`, `docker/compose.yml`, `api/config.py`, and
  `src/api/cases.ts` together if a port changes.
- Prefer binding services to `127.0.0.1` during local development.
