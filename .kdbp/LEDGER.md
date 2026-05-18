# Session Ledger

## 2026-05-18 13:41 — PHASE 1 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 1 commit gate.

- PLAN: Phase 1 `Commit` marked `✅`; Push remains pending.
- Included the consumer-credit analysis persistence contract, evidence
  provenance hardening, schema/migration/test coverage, architecture docs,
  tier decisions, execution ledger, and resolved review inbox state in the
  commit scope.

Verification:

- `uv run pytest -q` — passed, 58 tests.
- `uv run ruff check .` — passed.
- `uv run ruff format --check api/models/analysis.py api/models/extraction.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-analysis-phase1-commit.db uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
- `npm test` — passed, 24 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` and `git diff --cached --check` — passed.

## 2026-05-18 13:25 — PHASE 1 REVIEW: Analysis contract and persistence
VERDICT: APPROVE
FINDINGS: 1 total (1 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH — cross-run finding, cross-run calculation, and cross-case fact regression tests added during triage
CONFIDENCE: 75 -> 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/1 strict overlap, union consolidation
FIXES: #1 replaced single-column evidence FKs with composite FKs scoped to run/case, added composite unique targets on findings/calculations/facts tables, added 3 negative regression tests

## 2026-05-18 12:05 — PLAN CREATED: Build the consumer-credit analysis engine with stable structured output, deterministic discrepancy checks, official references, and evidence-backed finding presentation
PHASES: 5 | COMPLEXITY: high | MATURITY: mvp
TIERS: mvp × 4, ent × 1, scale × 0 | PROTOTYPES: 0
DECISIONS: D12 → D16 (5 phase tier decisions logged)

## 2026-05-18 11:40 — PLAN COMPLETED: Normalize consumer-credit facts and add confirmation gate
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-18_normalize-consumer-credit-facts.md
PHASES COMPLETED: 4 of 4

## 2026-05-18 11:29 — PUSH main -> main
PR: —
CI: no CI
PROMOTION: N/A
DEPLOYMENTS: P10 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-18 10:26 — PHASE 4 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 4 commit gate.

- PLAN: Phase 4 `Commit` marked `✅`; Push remains pending.
- Included the frontend fact review handoff, typed facts API client, prototype
  analysis guard, review fixes, regression tests, docs, and resolved review
  inbox state in the commit scope.

Verification:

- `npm test` — passed, 24 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest` — passed, 51 backend tests.
- `uv run ruff check` — passed.
- `git diff --check` — passed.

## 2026-05-18 10:22 — PHASE 4 REVIEW: Frontend fact review handoff

VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 2 high, 0 medium, 0 low)
COVERAGE: HIGH — upload/fact-refresh and correction-validation regressions
added during review
CONFIDENCE: 76 -> 96/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5)
FIXES: #1 kept a successfully saved upload out of the outer upload-failure path
when fact-readiness refresh fails; #2 rejected correction strings with no digits
before they can normalize to `0`.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 14 tests.
- `npm test` — passed, 24 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest` — passed, 51 backend tests.
- `uv run ruff check` — passed.
- `git diff --check` — passed.

## 2026-05-17 18:32 — PHASE 4 EXECUTION COMPLETE

Implemented the frontend fact review handoff.

- Added a typed facts API client for listing candidates, reading readiness, and
  recording confirm/correct/reject decisions.
- Extended the upload handoff with fact-candidate review, source snippets,
  status summaries, missing-required-field blockers, and correction controls.
- Added navigation state and a prototype-analysis guard that blocks later
  analysis screens until case readiness is open and the prototype acknowledgement
  is accepted.
- Updated docs to reflect that facts can now be reviewed while analysis/results
  remain prototype surfaces.
- PLAN: Phase 4 `Exec` marked `✅`; Review remains pending.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 12 tests.
- `npm test` — passed, 22 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest tests/api/test_facts_api.py` — passed, 7 backend tests.
- `uv run pytest` — passed, 51 backend tests.
- `git diff --check` — passed.

## 2026-05-17 18:25 — PHASE 4 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 4: Frontend fact review
handoff.

- PLAN: advanced from completed Phase 3 to Phase 4; Phase 4 `Exec` marked
  `🔄`.
- Scope is the frontend fact review handoff: API client/state, source snippets,
  confirm/correct/reject controls, unresolved fact summaries, and guardrails
  before prototype analysis.

## 2026-05-17 17:27 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P9 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-17 17:21 — PHASE 3 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 3 commit gate.

- PLAN: Phase 3 `Commit` marked `✅`; Push remains pending.
- Included owner-scoped fact listing, confirmation/correction/rejection,
  case-level readiness blockers, review fixes, API tests, architecture docs,
  and review inbox state in the commit scope.

Verification:

- `uv run pytest` — passed, 51 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run ruff check` — passed.
- `uv run ruff format --check api/main.py api/schemas/__init__.py api/schemas/facts.py api/routes/facts.py api/services/facts.py tests/api/test_facts_api.py` — passed, changed Python files already formatted.
- `git diff --check` — passed.
- Note: repo-wide `uv run ruff format --check` still reports pre-existing
  formatting drift in untouched Python files.

## 2026-05-15 18:42 — PHASE 3 REVIEW: Confirmation API and analysis gate
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 0 medium, 1 low)
COVERAGE: HIGH — type-incompatible correction validation test and list/readiness 404 tests added during triage
CONFIDENCE: 81 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 added value_kind-compatible correction validation with _validate_correction_compatibility() and InvalidCorrectionError → 422, #2 added 404 tests for list_facts and readiness on nonexistent case

## 2026-05-15 18:16 — PHASE 3 EXECUTION COMPLETE

Implemented the owner-scoped fact confirmation API and readiness gate.

- Added fact review service and routes for listing fact candidates, recording
  confirm/correct/reject decisions, and reporting case-level readiness blockers.
- Readiness now blocks analysis while any high-impact candidate remains pending
  or a required high-impact fact key has no candidate.
- Corrections preserve original extracted values and store corrected values on
  confirmation records.
- Updated architecture docs with the fact review boundary and API endpoints.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_facts_api.py` — passed, 5 tests.
- `uv run pytest` — passed, 49 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 18:10 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Confirmation API and
analysis gate.

- PLAN: Phase 3 `Exec` marked `🔄`.
- Scope is owner-scoped fact listing, confirmation/correction/rejection, and a
  case-level readiness state that blocks analysis until required high-impact
  facts are resolved.

## 2026-05-15 18:03 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P8 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 17:55 — PHASE 2 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 2 commit gate.

- PLAN: Phase 2 `Commit` marked `✅`; Push remains pending.
- Included deterministic fact extraction, review fixes, regression coverage, and
  architecture/KDBP bookkeeping in the commit scope.

Verification:

- `uv run pytest` — passed, 44 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 17:45 — PHASE 2 REVIEW: MVP fact extraction service
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 2 high, 0 medium, 0 low)
COVERAGE: HIGH — bare-currency regression test and fact-extraction-failure isolation test added during triage
CONFIDENCE: 71 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 require explicit CLP marker ($, clp, pesos) before setting value_currency — bare numbers leave currency unresolved, #2 wrap fact extraction in savepoint so text extraction completes independently on failure

## 2026-05-15 16:40 — PHASE 2 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 2: MVP fact extraction service.

- PLAN: Phase 2 `Exec` marked `🔄`.
- Scope remains deterministic local extraction from existing extracted text
  segments; OCR, LLM extraction, confirmation APIs, readiness gates, and
  findings stay out of scope.

## 2026-05-15 17:15 — PHASE 2 EXECUTION COMPLETE

Implemented deterministic MVP fact extraction from persisted text segments.

- Added `api/services/fact_extraction.py` with local rules for principal amount,
  currency, contract date, term, payment count, installment amount, interest
  rate, CAE, total cost, fees, insurance signals, linked products, and relevant
  clauses.
- Wired text extraction to clear stale pending facts and create pending fact
  candidates after successful consumer-credit text extraction.
- Missing or ambiguous required high-impact values are persisted as warning
  candidates instead of fabricated facts.
- Updated `docs/architecture.md` with the new fact-candidate boundary.
- PLAN: Phase 2 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_fact_extraction.py tests/api/test_documents_api.py`
  — passed, 21 tests.
- `uv run pytest` — passed, 42 tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-12 - gabe-init

Initialized KDBP for `nmkgn` as a hybrid MVP and agent-app documentation
profile. Seeded the first durable scope from `docs/V0_ALIGNMENT.md`.

## 2026-05-13 - Phase 1 started

Started ROADMAP Phase 1: Product Backbone and Case Intake.

- T1 in progress: structure standard will be updated for Alembic and Python
  package files.
- Implementation target: React/Vite case intake, FastAPI under `api/`,
  PostgreSQL persistence, Alembic migrations, and stub owner `demo-user`.

## 2026-05-13 - Phase 1 execution complete

Implemented ROADMAP Phase 1 execution scope.

- Added FastAPI app under `api/` with health and case endpoints.
- Added SQLAlchemy case model, DB session helper, Alembic environment, and
  initial `cases` migration.
- Added PostgreSQL local service under `docker/compose.yml`.
- Added backend tests for health, validation, create/list/read, ownership scope,
  and Alembic upgrade.
- Added React case setup screen before upload, API client, navigation case state,
  and stub login flow.
- Added focused frontend tests for case setup validation, successful submit, and
  API failure handling.
- Fixed React fast-refresh lint issue by moving `LENSES` data out of the
  component module.

Verification:

- `uv run pytest` — passed, 6 tests.
- `npm test` — passed, 3 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `docker compose -f docker/compose.yml up -d postgres` — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against
  local PostgreSQL.
- FastAPI `POST /api/cases` + `GET /api/cases/{id}` smoke — passed against
  local PostgreSQL with case id `472c40f7-dd2b-4d55-9afd-0634a786e553`.

## 2026-05-13 - Local port registry

Moved nmkgn local development off common workstation defaults.

- Registered ports in `.kdbp/PORTS.md`.
- Web app: `15179`.
- Vite preview: `15180`.
- FastAPI API: `18080`.
- PostgreSQL host port: `55432`.
- Updated package scripts, frontend API default, backend database/CORS defaults,
  Docker Compose port mapping, and frontend tests.
- Verified registered stack:
  - `npm run db:up` — passed; `nmkgn-postgres-1` healthy on `127.0.0.1:55432`.
  - `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
  - `uv run pytest` — passed, 6 tests.
  - `npm test` — passed, 3 tests.
  - `npm run lint` — passed.
  - `npm run build` — passed.
  - `GET http://127.0.0.1:18080/api/health` — passed.
  - `GET http://127.0.0.1:15179/` — passed.
  - `POST http://127.0.0.1:18080/api/cases` — passed with case id
    `1805f90b-14b3-4584-8d49-65275bdd5589`.
- Started detached dev sessions:
  - `tmux` session `nmkgn-api` runs `npm run api:dev`.
  - `tmux` session `nmkgn-web` runs `npm run dev`.

## 2026-05-13 - Phase 1 alignment cleanup

Addressed immediate `/gabe-align` concerns.

- Added an upload-step prototype guard so a persisted real case cannot enter the
  old mock analysis flow until the user acknowledges that later screens still
  use simulated findings.
- Added frontend validation for optional numeric fields so typed invalid amounts
  or terms are not silently omitted from the case payload.
- Added frontend tests for the numeric validation and prototype guard.
- Deferred Phase 2 provenance-ready persistence and config consolidation in
  `.kdbp/PENDING.md`.

Verification:

- `npm test` — passed, 7 tests.
- `uv run pytest` — passed, 6 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- `GET http://127.0.0.1:18080/api/health` — passed.
- `GET http://127.0.0.1:15179/` — passed.

## 2026-05-13 17:31 — PHASE 1 REVIEW: Product Backbone and Case Intake
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 3 high, 0 medium, 0 low)
COVERAGE: HIGH — all 3 findings now covered by tests (7 backend, 9 frontend)
CONFIDENCE: 90/100
DEFERRED: none
ALIGNMENT: DRIFTED (justified — port registration and alignment cleanup alongside plan scope)
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 3/3 strict overlap
FIXES: #1 go() guard blocks mock analysis steps without prototype ack, #2 Upload locks non-credit doc types for persisted cases, #3 Pydantic model_validator rejects stage/plan mismatch

## 2026-05-13 17:40 — PHASE 1 COMMIT GATE

Prepared `/gabe-next` routed through `/gabe-commit` for Phase 1.

- Updated architecture docs with the implemented case model, API endpoints,
  owner scoping, stage/analysis-plan constraints, and registered local ports.
- Updated V0 alignment docs with the active Phase 1 path:
  login -> case setup -> persisted consumer-credit case -> upload handoff.
- Marked the Phase 1 commit column complete; push remains pending.

Verification:

- `uv run pytest` — passed, 7 backend tests.
- `npm test` — passed, 9 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against
  local PostgreSQL on `127.0.0.1:55432`.
- `git diff --check` — passed.
- `GET http://127.0.0.1:18080/api/health` — passed.
- `GET http://127.0.0.1:15179/` — passed.
- `docker compose -f docker/compose.yml ps` — PostgreSQL healthy.

## 2026-05-13 19:20 — PHASE 2 EXECUTION: Claude Design Intake and Case-Flow Gap Analysis

Implemented the design-intake phase for the Claude export under
`docs/design/incoming/claude-design-20260513/`.

- Removed `nmkgn.zip:Zone.Identifier` from the curated import and ignored future
  Windows zone metadata files.
- Preserved the useful Claude HTML, JSX, screenshot, canvas-state, and asset
  files as reference material.
- Added a package manifest at
  `docs/design/incoming/claude-design-20260513/MANIFEST.md`.
- Added `docs/design/CLAUDE_20260513_INVENTORY.md`.
- Added `docs/design/CLAUDE_20260513_GAP_ANALYSIS.md`.
- Updated structure rules to allow `docs/design/incoming/**`.
- Registered optional static design preview port `15181`.
- Added Phase 2 to the active KDBP plan with execution complete and review,
  commit, and push pending.
- Left `src/`, `api/`, migrations, tests, and runtime behavior unchanged.

Verification:

- `git diff --check` — passed.
- `git status --short -uall` — checked; changed files are limited to
  design-intake/KDBP/reference material.
- Static preview smoke on `127.0.0.1:15181` — passed for:
  - `letra. · Main flow.html`
  - `wireframes.html`
  - `Coach · Hi-fi explorations.html`
- `npm run lint` — passed.
- `npm run build` — passed.
- `ss -ltn sport = :15181` — no lingering preview server.

## 2026-05-13 19:37 — PHASE 2 REVIEW: Claude Design Intake and Case-Flow Gap Analysis

VERDICT: APPROVE
FINDINGS: 0 total (0 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH — checked KDBP state, design manifest, inventory, gap analysis,
imported reference files, static preview, and regression gates.
CONFIDENCE: 96/100
DEFERRED: none
ALIGNMENT: ALIGNED — changed files are limited to design-intake/KDBP/reference
material; no product runtime files changed.
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5)

Verification:

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- Static preview smoke on `127.0.0.1:15181` — passed for:
  - `letra. · Main flow.html`
  - `wireframes.html`
  - `Coach · Hi-fi explorations.html`
- `find docs/design/incoming/claude-design-20260513 -name '*:Zone.Identifier'`
  — no matches.
- `ss -ltn sport = :15181` — no lingering preview server.

## 2026-05-13 19:45 — [9766c9d] docs(design): add Claude design intake, inventory, and gap analysis
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-13 19:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P1 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 09:07 — PLAN UPDATED: Product Backbone and Case-Flow Alignment

CHANGE: Refreshed the active plan after Phase 1 and Phase 2 completion, normalized
the phase tracker cells to `✅` / `⬜`, advanced `## Current Phase` to Phase 3,
and added "Case Flow UI Alignment from Claude Design" as the next executable
phase.

- Wrote only `.kdbp/PLAN.md` and `.kdbp/LEDGER.md`; `SCOPE.md` and
  `ROADMAP.md` remain `/gabe-scope*` surfaces.
- Phase 3 is based on `docs/design/CLAUDE_20260513_GAP_ANALYSIS.md` and keeps
  real upload persistence, OCR, agents, and unrestricted document types out of
  scope.

## 2026-05-14 09:09 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Case Flow UI Alignment from
Claude Design.

- PLAN: Phase 3 `Exec` marked `🔄`.
- Scope remains UI/state alignment only; backend persistence, OCR, agents,
  history/settings/share/email, and unrestricted document types stay out of
  scope.

## 2026-05-14 09:35 — PHASE 3 EXECUTION COMPLETE

Implemented Phase 3 case-flow UI alignment from the curated Claude design
reference.

- Added persistent case context and prototype-state notices across the post-case
  flow.
- Refreshed login/case setup/upload framing while preserving persisted
  `consumer_credit` case creation, unsupported document locks, and the prototype
  acknowledgement guard.
- Added prototype-only detection branches for ready, low confidence,
  unsupported, and failed states.
- Added responsive structure for the key case-flow layouts.
- Added focused frontend coverage for detection branch routing and upload branch
  selection.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `npm test` — passed, 14 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-14 10:16 — PHASE 3 REVIEW: Case Flow UI Alignment from Claude Design
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 1 medium, 1 low)
COVERAGE: MEDIUM — detection branch routing and upload scenario selection tested; responsive/viewport not exercisable in jsdom
CONFIDENCE: 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap
FIXES: #1 revised acceptance text + added responsive class-name tests, #2 replaced fragile CSS attribute selector with .app-content-area class

## 2026-05-14 10:19 — [a6449d9] feat(screens): align case-flow UI to Claude design reference
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-14 10:20 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P2 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 10:21 — PLAN COMPLETED: Product Backbone and Case-Flow Alignment
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-14_product-backbone-case-flow.md
PHASES COMPLETED: 3 of 3

## 2026-05-14 10:29 — PLAN CREATED: Real document upload persistence and text extraction

PHASES: 4 | COMPLEXITY: medium | MATURITY: mvp
TIERS: mvp x 4, ent x 0, scale x 0 | PROTOTYPES: 0
DECISIONS: D4 -> D7 (4 phase tier decisions logged)
RELATED: PENDING #1, PENDING #2, ROADMAP Phase 2, and the text-extraction bridge into ROADMAP Phase 3

## 2026-05-14 10:35 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Storage contract and schema.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is schema/config/docs only: no upload endpoint, extraction service,
  OCR provider, frontend behavior, or agent/finding pipeline changes.

## 2026-05-14 10:40 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 storage contract and schema.

- Added env-backed upload storage settings and `.env.example`.
- Added document and extracted-text SQLAlchemy models.
- Added document/extracted-text Pydantic schemas.
- Added Alembic migration `20260514_0002_create_documents`.
- Added contract tests for upload settings, document roles, text span validation,
  model persistence, and migration-created tables.
- Updated architecture and agent docs with the document/text boundary.
- Updated `.kdbp/STRUCTURE.md` to allow `.env.example`.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 11 tests.
- `uv run pytest` — passed, 11 API tests.
- `git diff --check` — passed.
- `npm run db:up` — passed; PostgreSQL container running.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against local PostgreSQL.

## 2026-05-14 16:38 — PHASE 1 REVIEW: Storage contract and schema
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 0 high, 2 medium, 1 low)
COVERAGE: MEDIUM — API contract tests and SQLite Alembic passed; live PostgreSQL migration not rerun because Docker is unavailable in this WSL distro
CONFIDENCE: 92/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
FIXES: added upload-config bound validation, complete extracted-text locator validation, SHA-256 hex validation, and matching tests

## 2026-05-14 16:45 — [2f448bb] feat(storage): add document and extraction schema with provenance-ready storage contract
FINDINGS: 4 (2 critical, 1 high, 1 low)
ACTIONS: 1:fix 2:fix 3:resolve-now 4:update-docs
DEFERRED: none
RESOLVED: PENDING #1 (provenance-ready persistence — addressed by this commit)

## 2026-05-14 16:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P3 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 21:31 — PHASE 2 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 2: Backend ingestion API.

- PLAN: Current Phase advanced from Phase 1 to Phase 2; Phase 2 `Exec` marked `🔄`.
- Scope is backend ingestion only: multipart upload, owner/case validation,
  local file persistence, document metadata reads, and backend tests.
- Out of scope: text extraction, OCR, frontend upload wiring, public file
  serving, antivirus scanning, and production storage hardening.

## 2026-05-14 21:35 — PHASE 2 EXECUTION COMPLETE

Implemented Phase 2 backend ingestion API.

- Added multipart document upload endpoints under `/api/cases/{case_id}/documents`.
- Added scoped document listing and metadata read endpoints.
- Added local upload storage service with filename/path sanitization,
  checksum calculation, byte-size enforcement, content-type enforcement,
  delete-after metadata, and rollback cleanup for rejected writes.
- Added `python-multipart` for FastAPI form/file parsing.
- Added backend API coverage for successful upload persistence, stub-owner
  scoping, other-owner case rejection, unsupported media types, oversize
  payload cleanup, and metadata reads.
- PLAN: Phase 2 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_api.py tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 22 tests.
- `uv run ruff format --check api/routes/documents.py api/services/documents.py tests/api/test_documents_api.py api/main.py` — passed.
- `uv run ruff check .` — passed.
- `uv run pytest -q` — passed, 22 tests.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports 12 pre-existing backend/test files outside this Phase 2 change that would be reformatted.

## 2026-05-14 22:30 — PHASE 2 REVIEW: Backend ingestion API
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (empty file 400, storage write 500, list/read 404, plus prior happy path, owner scoping, unsupported type, oversize)
CONFIDENCE: 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 added empty-file and storage-write-failure tests, #2 added list/read 404 tests

## 2026-05-14 22:45 — [420c1b0] feat(documents): add scoped multipart upload, list, and read API
FINDINGS: 3 (0 critical, 1 high, 1 medium, 1 low)
ACTIONS: 1:update-docs 2:accept 3:accept
DEFERRED: none

## 2026-05-14 22:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P4 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 22:51 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Text extraction pipeline.

- PLAN: Current Phase advanced from Phase 2 to Phase 3; Phase 3 `Exec` marked `🔄`.
- Scope is text extraction only: supported text-bearing uploads, persisted
  extracted text segments, status transitions, warnings/failures, and backend
  tests.
- Out of scope: OCR provider integration, background worker queues/retries,
  normalized fact extraction, findings, and frontend upload wiring.

## 2026-05-14 22:56 — PHASE 3 EXECUTION COMPLETE

Implemented Phase 3 text extraction pipeline.

- Added synchronous local extraction after document upload.
- Added `pypdf` for text-bearing PDF extraction.
- Added plain-text span segmentation and PDF page segmentation.
- Marked image uploads and text-empty PDFs as `needs_ocr`.
- Marked malformed/unreadable PDF extraction as `failed` without failing stored
  upload persistence.
- Added owner-scoped `GET /api/cases/{case_id}/documents/{document_id}/text-segments`.
- Updated architecture docs with the extraction boundary and endpoint.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_api.py tests/api/test_documents_contract.py -q` — passed, 23 tests.
- `uv run ruff check api/services/text_extraction.py api/services/documents.py api/routes/documents.py tests/api/test_documents_api.py` — passed.
- `uv run ruff format --check api/services/text_extraction.py api/services/documents.py api/routes/documents.py tests/api/test_documents_api.py` — passed.
- `uv run pytest -q` — passed, 30 tests.
- `uv run ruff check .` — passed.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports 12 pre-existing backend/test
  files outside this Phase 3 change that would be reformatted.

## 2026-05-14 23:10 — PHASE 3 REVIEW: Text extraction pipeline
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (text-segments 404 for nonexistent case and document, decode warning for non-UTF-8, partial_pdf_text warning for mixed PDFs, plus prior happy path, needs_ocr, and failed statuses)
CONFIDENCE: 90/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 2/2 strict overlap, union consolidation
FIXES: #1 added text-segments 404 tests for nonexistent case and nonexistent document, #2 added decode_replacement warning test for non-UTF-8 plain text and partial_pdf_text warning test for mixed blank/text PDF pages

## 2026-05-15 — [b25365a] feat(extraction): add synchronous text extraction pipeline with warning tracking
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:update-docs
DEFERRED: none

## 2026-05-15 00:28 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P5 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 00:51 — PHASE 4 EXECUTION COMPLETE

Implemented Phase 4 frontend upload/status handoff.

- Added shared frontend API base/error handling in `src/api/client.ts`.
- Added document API client for upload, document listing, and text-segment reads.
- Replaced the persisted-case upload screen's prototype-only action with real
  file selection, role selection, multipart upload, server-backed document
  status, upload progress state, and extracted-text preview.
- Kept later analysis screens guarded as prototype-only until normalized facts,
  confirmations, agents, and evidence-backed findings exist.
- Updated V0 and architecture docs to reflect the real upload boundary.
- PLAN: Current Phase advanced from Phase 3 to Phase 4; Phase 4 `Exec` marked
  `✅`; Review remains pending.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 8 tests.
- `npm test` — passed, 18 frontend tests.
- `uv run pytest` — passed, 34 API tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 01:15 — PHASE 4 REVIEW: Frontend upload/status handoff
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 2 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (POST failure, POST success + refresh failure, initial list load failure, plus prior happy path, metadata display, OCR-pending, and prototype guard)
CONFIDENCE: 61 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 2/3 strict overlap, union consolidation
FIXES: #1 separated POST success from refresh failure in handleUpload to prevent duplicate-upload risk, #2 added POST-failure, refresh-failure, and list-load-failure tests, #3 documented VITE_API_BASE_URL in .env.example and updated PORTS.md reference from cases.ts to client.ts

## 2026-05-15 01:21 — [d5a6db4] feat(upload): wire frontend to real document upload, status, and text preview
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:update-docs (README.md — added VITE_API_BASE_URL mention)
DEFERRED: none

## 2026-05-15 15:33 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P6 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 15:33 — PLAN COMPLETED: Real document upload persistence and text extraction
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-15_document-upload-text-extraction.md
PHASES COMPLETED: 4 of 4

## 2026-05-15 15:51 — PLAN CREATED: Normalize consumer-credit facts and add confirmation gate
PHASES: 4 | COMPLEXITY: high x 2, med x 2 | MATURITY: mvp
TIERS: mvp x 4, ent x 0, scale x 0 | PROTOTYPES: 0
DECISIONS: D8 → D11 (4 phase tier decisions logged)

## 2026-05-15 15:53 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Fact contract and schema.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is schema/contract only: normalized fact persistence, confirmation
  persistence, Pydantic schemas, Alembic migration, architecture docs, and
  focused contract tests.
- Out of scope: extraction service implementation, confirmation API endpoints,
  frontend fact review, agents, findings, OCR, and exports.

## 2026-05-15 15:58 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 fact contract and schema.

- Added SQLAlchemy models for normalized consumer-credit fact candidates and
  fact confirmation records.
- Added Alembic migration `20260515_0003` for `consumer_credit_facts` and
  `fact_confirmations`.
- Added Pydantic schemas for fact creation/read and confirmation creation/read.
- Added contract tests for fact source locators, value/warning requirements,
  correction boundaries, relationships, DB constraints, and Alembic table
  creation.
- Updated architecture docs with fact/confirmation data model and boundary.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 20 tests.
- `uv run ruff check api/models/extraction.py api/models/document.py api/models/__init__.py api/schemas/__init__.py api/schemas/facts.py api/migrations/versions/20260515_0003_create_consumer_credit_facts.py tests/api/test_documents_contract.py tests/api/test_cases.py` — passed.
- `uv run ruff format --check api/models/extraction.py api/models/document.py api/models/__init__.py api/schemas/__init__.py api/schemas/facts.py api/migrations/versions/20260515_0003_create_consumer_credit_facts.py tests/api/test_documents_contract.py tests/api/test_cases.py` — passed.
- `uv run pytest -q` — passed, 37 tests.
- `uv run ruff check .` — passed.
- `git diff --check` — passed.

## 2026-05-15 16:20 — PHASE 1 REVIEW: Fact contract and schema
VERDICT: APPROVE
FINDINGS: 1 total (1 critical, 0 high, 0 medium, 0 low)
COVERAGE: MEDIUM — cross-provenance regression test added during triage; text_segment/document consistency accepted as MVP limitation
CONFIDENCE: 75 → 95/100
DEFERRED: none
ALIGNMENT: DRIFTED (workflow state alongside plan scope — no implementation risk)
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/1 strict overlap, union consolidation
FIXES: #1 replaced independent case_id/document_id FKs with composite FK (document_id, case_id) → (documents.id, documents.case_id), added UniqueConstraint targets, added cross-provenance regression test

## 2026-05-15 16:30 — [2706cb5] feat(facts): add consumer-credit fact and confirmation persistence contract
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:accept (pre-existing alembic env issue)
DEFERRED: 0

## 2026-05-15 16:30 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P7 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-18 12:48 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Analysis contract and
persistence.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is contract/persistence only: analysis run, finding, evidence/citation,
  calculation, unsupported-output schemas, Alembic migration, architecture docs,
  and focused contract tests.
- Out of scope: deterministic calculation service, official reference catalog,
  agent orchestration, analysis API endpoints, and frontend source inspection.

## 2026-05-18 12:56 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 analysis contract and persistence.

- Added SQLAlchemy models for versioned analysis runs, deterministic
  calculations, trusted findings, typed evidence/citations, and audit-only
  unsupported outputs.
- Added Alembic migration `20260518_0004` for the analysis contract tables and
  constraints.
- Added Pydantic schemas for `ConsumerCreditAnalysis`, analysis runs, findings,
  evidence anchors, calculation evidence, citations, inference metadata, and
  unsupported outputs.
- Added contract tests for supported finding boundaries, typed evidence anchors,
  analysis persistence, and database rejection of unsupported finding claims.
- Updated architecture docs with the analysis data model and contract boundary.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run ruff check api/models/analysis.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `uv run ruff format --check api/models/analysis.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `uv run pytest tests/api/test_analysis_contract.py -q` — passed, 4 tests.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-analysis-phase1-verify.db uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
- `uv run pytest -q` — passed, 55 tests.
- `uv run ruff check .` — passed.
- `npm test` — passed, 24 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports pre-existing untouched
  files that would be reformatted; changed files are format-clean.
