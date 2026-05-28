# Phase 3 — E2E Smoke Test Report

## Date: 2026-05-28

## Target
- URL: https://nmkgn-app-production.up.railway.app
- Browser: Chromium (headless, Playwright)
- Runner: pytest-playwright 0.8.0

## Results: 6/6 PASSED (13.73s)

```
tests/e2e/test_smoke.py::test_health_endpoint PASSED
tests/e2e/test_smoke.py::test_spa_loads[chromium] PASSED
tests/e2e/test_smoke.py::test_login_screen_renders[chromium] PASSED
tests/e2e/test_smoke.py::test_login_to_case_setup_navigation[chromium] PASSED
tests/e2e/test_smoke.py::test_cases_api_returns_list PASSED
tests/e2e/test_smoke.py::test_case_create_and_list PASSED
```

## Test Coverage

| Test | What it verifies |
|------|-----------------|
| health_endpoint | /api/health returns {"status":"ok"} |
| spa_loads | Root URL serves React SPA with #root element |
| login_screen_renders | "Continuar con Google" button visible on initial load |
| login_to_case_setup_navigation | Clicking login navigates to case setup screen |
| cases_api_returns_list | GET /api/cases returns 200 with JSON array |
| case_create_and_list | POST /api/cases creates case (201), GET lists it |

## Issues Found and Fixed During Phase

1. Railway releaseCommand (Alembic migration) never ran successfully — tables missing
   - Root cause: early deploys used `postgresql://` URL without psycopg3 normalization
   - Fix: ran migration manually via public DATABASE_URL
   - TODO: investigate why releaseCommand fails silently on Railway

2. Dockerfile /app ownership prevented non-root user from running uv commands
   - Fix: added `RUN chown -R appuser:appuser /app` before USER switch

## Run Command
```bash
uv run pytest tests/e2e/test_smoke.py -v --browser chromium
```

Override base URL:
```bash
E2E_BASE_URL="http://127.0.0.1:18080" uv run pytest tests/e2e/test_smoke.py -v --browser chromium
```
