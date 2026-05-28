# Phase 2 — Railway Deploy Verification

## Date: 2026-05-28

## Health Check
```
$ curl -s https://nmkgn-app-production.up.railway.app/api/health
{"status": "ok"}
```

## SPA Frontend
```
$ curl -s -w "\nHTTP %{http_code}" https://nmkgn-app-production.up.railway.app/
<!doctype html>
<html lang="es">
  <head>
    ...
    <script type="module" crossorigin src="/assets/index-RY5wSjd_.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-p0C73-UZ.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
HTTP 200
```

## Railway Deploy Logs
```
Starting Container
Installed 3 packages in 28ms
INFO:     Started server process [33]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
INFO:     100.64.0.2:42083 - "GET /api/health HTTP/1.1" 200 OK
```

## Service Configuration
- Project: nmkgn
- Environment: production
- Service: nmkgn-app
- Domain: https://nmkgn-app-production.up.railway.app
- PostgreSQL: Railway plugin (auto-provisioned)
- App sleeping: enabled (scale-to-zero)
- Release command: `uv run alembic -c api/migrations/alembic.ini upgrade head`

## Deploy Fixes Applied
1. `$PORT` env var not expanded in startCommand → hardcoded port 8080
2. Railway DATABASE_URL uses `postgresql://` → normalized to `postgresql+psycopg://` for psycopg3
