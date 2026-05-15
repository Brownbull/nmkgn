# Active Plan

<!-- status: completed -->
<!-- project_type: hybrid -->
<!-- goal: Product Backbone and Case-Flow Alignment -->
<!-- created: 2026-05-13 -->
<!-- Last Updated: 2026-05-14T10:20 -->

Maintain the completed production backbone slice and use the curated Claude
design intake to align the case-flow UI without changing the current persistence,
OCR, or agent boundaries.

## Phase Table

| # | Phase | Description | Complexity | Exec | Review | Commit | Push |
|---|---|---|---|---|---|---|---|
| 1 | Product Backbone and Case Intake | Add FastAPI, PostgreSQL/Alembic, lean case intake, frontend API wiring, and verification for REQ-01. | medium | ✅ | ✅ | ✅ | ✅ |
| 2 | Claude Design Intake and Case-Flow Gap Analysis | Curate the imported Claude design export, inventory its screens/assets, map gaps against Phase 1, and recommend the next case-flow UI integration. | low | ✅ | ✅ | ✅ | ✅ |
| 3 | Case Flow UI Alignment from Claude Design | Align login, case setup, upload, detection, plan, and coach UI with the curated Claude design while preserving persisted consumer-credit constraints and prototype-only analysis states. | medium | ✅ | ✅ | ✅ | ✅ |

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
- Case-flow UI alignment from the curated Claude design reference for login,
  case setup, upload, detection, plan selection, and coach dashboard screens.
- Prototype-only detection states: ready, low confidence, unsupported, and
  failed.
- Responsive checks for desktop and mobile widths.

### Out

- Real authentication.
- Document upload persistence.
- OCR and agents.
- Provenance record implementation beyond Phase 1 structural preparation.
- Production retention/deletion enforcement.
- Direct copy of Claude JSX into `src/`.
- History, settings, share, compare, or email implementation unless needed for
  the current case-flow screens.

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

Phase 3: Case Flow UI Alignment from Claude Design

## Phase 2 - Claude Design Intake and Case-Flow Gap Analysis

### Scope

### In

- Curated reference import under `docs/design/incoming/claude-design-20260513/`.
- Manifest for the imported package.
- Inventory of high-fidelity, wireframe, coach exploration, mobile, and asset
  material.
- Gap analysis against the committed Phase 1 case-based app.
- Optional static preview port registration.

### Out

- Product UI implementation.
- Changes to `src/`, `api/`, migrations, tests, or runtime behavior.
- Direct copy of Claude JSX into the React/Vite app.

### Tasks

| ID | Task | Status |
|---|---|---|
| D1 | Remove disposable download metadata and ignore future `*:Zone.Identifier` files. | complete |
| D2 | Update structure and port registry for imported design references. | complete |
| D3 | Add Claude package manifest. | complete |
| D4 | Add package inventory. | complete |
| D5 | Add case-flow gap analysis and next implementation recommendation. | complete |
| D6 | Run non-runtime verification gates. | complete |

### Acceptance

- The Claude export is preserved as curated reference material.
- The import is documented before any product UI changes.
- The next implementation recommendation prioritizes case flow only:
  login, case setup, upload, detection, plan, and coach.
- Phase 1 backend/API behavior remains untouched.

### Verification

- `git diff --check` — passed.
- `git status --short -uall` — checked; only design-intake/KDBP/reference files
  changed.
- Static preview smoke on `127.0.0.1:15181` — passed for the three main HTML
  canvases.
- `npm run lint` — passed.
- `npm run build` — passed.

## Phase 3 - Case Flow UI Alignment from Claude Design

### Scope

### In

- Login, case setup, upload, detection, plan selection, and coach dashboard UI
  alignment using `docs/design/incoming/claude-design-20260513/` as reference.
- Persistent case/document context signal after case creation.
- Upload layout refresh that preserves persisted-case document locks and the
  prototype acknowledgement guard.
- Prototype-only detection branches for ready, low confidence, unsupported, and
  failed states.
- Plan and coach hierarchy updates from the Claude criteria, KPI, benchmark,
  and action-plan direction.
- Responsive desktop and mobile behavior checks.
- Focused frontend tests for case setup, upload guard, detection branches, and
  basic responsive assumptions.

### Out

- Real upload persistence.
- OCR or document detection.
- Agent output schemas or analysis pipeline changes.
- History, settings, share, compare, or email surfaces.
- Unrestricted multi-document-type persistence.
- Direct copy of Claude JSX into the Vite app.

### Tasks

| ID | Task | Status |
|---|---|---|
| U1 | Align login and case setup to the selected `letra.` visual language without removing persisted case creation. | complete |
| U2 | Add a persistent case/document context badge after case creation. | complete |
| U3 | Refresh upload layout from Claude references while preserving persisted-case locks and prototype acknowledgement. | complete |
| U4 | Add prototype-only detection branches: ready, low confidence, unsupported, and failed. | complete |
| U5 | Align plan selection and analysis-running hierarchy to the Claude criteria model. | complete |
| U6 | Align coach dashboard hierarchy to the impact, KPI, benchmark, and action-plan direction. | complete |
| U7 | Add or update responsive and state-routing frontend tests, then run verification. | complete |

### Tier Decision

- **Base tier:** MVP
- **Reason:** Phase 3 should polish and align the existing prototype-backed
  case flow without introducing real document ingestion, OCR, agents, or new
  production trust claims.

### Acceptance

- The app still creates and uses a persisted `consumer_credit` case before
  upload.
- Unsupported document types cannot mutate persisted Phase 1 cases.
- Simulated analysis states remain visibly marked as prototype-only.
- Case-flow screens work on desktop and mobile widths (manual verification;
  automated viewport testing deferred until Playwright is added).
- Tests cover case setup, upload guard, detection branch routing, responsive
  class-name presence, and basic rendering assumptions.

### Verification

- `npm test` — passed, 14 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## Archived

- **Resolution:** completed
- **Date:** 2026-05-14
- **Reason:** Goal achieved — all 3 phases (backbone, design intake, case-flow UI alignment) passed all gates.
