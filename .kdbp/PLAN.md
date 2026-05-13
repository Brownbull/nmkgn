# Active Plan

<!-- status: active -->
<!-- project_type: hybrid -->
<!-- goal: ROADMAP Phase 1 - Product Backbone and Case Intake -->
<!-- created: 2026-05-13 -->

Create the first production backbone slice: a user can create a persisted
Chilean consumer-credit case through the React/Vite app, FastAPI API, and
PostgreSQL database.

## Phase Table

| # | Phase | Description | Complexity | Exec | Review | Commit | Push |
|---|---|---|---|---|---|---|
| 1 | Product Backbone and Case Intake | Add FastAPI, PostgreSQL/Alembic, lean case intake, frontend API wiring, and verification for REQ-01. | medium | complete | complete | complete | pending |

## Scope

### In

- FastAPI app under `api/`.
- PostgreSQL persistence with Alembic migrations.
- Stub login identity with fixed owner `demo-user`.
- Lean fixed case fields.
- API endpoints: `GET /api/health`, `POST /api/cases`, `GET /api/cases`,
  `GET /api/cases/{id}`.
- React case setup screen before upload.
- Existing lint blocker fix for `src/components/Lenses.tsx`.

### Out

- Real authentication.
- Document upload persistence.
- OCR and agents.
- Provenance record implementation beyond Phase 1 structural preparation.
- Production retention/deletion enforcement.

## Tasks

| ID | Task | Status |
|---|---|---|
| T1 | Update structure standard for Alembic and Python package files. | complete |
| T2 | Add FastAPI project dependencies and lockfile. | complete |
| T3 | Implement SQLAlchemy case model, DB session, and Alembic migration. | complete |
| T4 | Implement case schemas, service, routes, and health endpoint. | complete |
| T5 | Add backend tests for health, validation, create/list/read, and migration import. | complete |
| T6 | Add React case setup screen, API client, and navigation state. | complete |
| T7 | Fix `LENSES` fast-refresh lint blocker. | complete |
| T8 | Run verification: backend tests, `npm run lint`, `npm run build`, and migration check where available. | complete |

## Tier Decision

- **Base tier:** MVP
- **Reason:** Phase 1 should build the spine before the scanner: real case
  persistence and API wiring, without auth, OCR, agents, or document storage.

## Acceptance

- A case cannot be created without a valid `case_stage`.
- Created cases persist through the FastAPI/PostgreSQL data path.
- Frontend stores the returned `caseId` and advances to upload.
- Verification commands are recorded in `.kdbp/LEDGER.md`.

## Verification

- `uv run pytest` — passed, 7 backend tests.
- `npm test` — passed, 9 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against local PostgreSQL.
- FastAPI `POST /api/cases` and `GET /api/cases/{id}` smoke — passed against local PostgreSQL.
- `git diff --check` — passed.
- `GET http://127.0.0.1:18080/api/health` — passed.
- `GET http://127.0.0.1:15179/` — passed.

## Current Phase

Phase 1 execution, review, and commit are complete. Push remains pending.
