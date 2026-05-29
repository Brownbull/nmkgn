# Active Plan

<!-- status: active -->
<!-- project_type: code -->

## Goal

Evidence Export, Audit, and Production Guardrails — Roadmap Phase 7 (REQ-12, REQ-13): generate exportable summaries and editable communication drafts from user-selected evidence-backed findings (refusing unsupported outputs); track run state, progress, cost, token use, latency, extraction warnings, suppressed findings, retention/deletion status with auditable timelines.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer
- **Created:** 2026-05-27
- **Last Updated:** 2026-05-29

## Current Phase

Phase 6: Finding selection and export service

## Phases

| # | Phase | Description | Tier | Types | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|------|-------|------------|------|--------|--------|------|
| 1 | Run audit timeline and observability | Wire run-level audit fields (status lifecycle, token counts, cost, latency, warnings, suppressed findings) into the analysis service with structured timeline events | ent | data-processing, data-validation | medium | ✅ | ✅ | ✅ | ✅ |
| 2 | Railway deployment and production config | Deploy nmkgn (FastAPI + React + PostgreSQL) to Railway Pro with Dockerfile, railway.toml, Alembic pre-deploy migration, CORS for production URLs, and cost-optimized resource settings | mvp (Rollback→ent, Migration→ent) | migration, rollout | medium | ✅ | ✅ | ✅ | ✅ |
| 3 | E2E and integration testing infrastructure | Set up Playwright (Python) for E2E testing against local dev and deployed Railway URL, write smoke tests covering health, SPA loading, navigation, and case creation flow with fake providers | mvp | testing, integration | medium | ✅ | ✅ | ✅ | ✅ |
| 4 | Fact review UX improvements | Add bulk actions (confirm all pending, mark all reviewed), progress statistics strip, group facts by category with collapsible sections, high-impact-first sort, and consistent fixed-position action buttons | ent | user-facing, client-state | medium | ✅ | ✅ | ✅ | ✅ |
| 5 | Document retention and access guardrails | Enforce retention_state transitions (active → delete_requested → deleted), owner-scoped access checks, and audit logging for document lifecycle events | ent | data-processing, data-validation | medium | ✅ | ✅ | ✅ | ✅ |
| 6 | Finding selection and export service | Build export service that accepts user-selected finding IDs, validates each has evidence backing, assembles exportable summary with source references, and refuses unsupported outputs | ent | data-processing | medium | ✅ | ✅ | ✅ | ✅ |
| 7 | Communication draft generation | Add draft generation service using PydanticAI to produce editable communication drafts from selected findings with B4-compliant cautious language and deterministic post-filter | ent (Str.out→ent, Cost→ent) | ai-agent, data-processing | medium | ⬜ | ⬜ | ⬜ | ⬜ |
| 8 | Export and draft UI | Replace Email.tsx mockup with real export/draft screens: finding selection checkboxes, export preview, draft generation trigger, editable draft editor, and copy/download actions | ent | user-facing, client-state, web | high | ⬜ | ⬜ | ⬜ | ⬜ |

## Phase Details

### Phase 1 — Run audit timeline and observability

```yaml
phase: 1
types: [data-processing, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D28
```

### Phase 2 — Railway deployment and production config

```yaml
phase: 2
types: [migration, rollout]
phase_tier: mvp
prototype: false
dim_overrides:
  - section: Deployment/Release
    dim: Rollback plan
    tier: ent
    reason: Red-line — rollback plan mandatory for production deploy
  - section: Deployment/Release
    dim: Migration order
    tier: ent
    reason: Red-line — schema + code in same release requires migrate-first
sections_considered: [Core, Deployment/Release]
suppressed_dims_count: 2
decisions_entry: D33
```

### Phase 3 — E2E and integration testing infrastructure

```yaml
phase: 3
types: [testing, integration]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D34
```

### Phase 4 — Fact review UX improvements

```yaml
phase: 4
types: [user-facing, client-state]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 5
decisions_entry: D35
```

### Phase 5 — Document retention and access guardrails

```yaml
phase: 5
types: [data-processing, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D29
```

### Phase 6 — Finding selection and export service

```yaml
phase: 6
types: [data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D30
```

### Phase 7 — Communication draft generation

```yaml
phase: 7
types: [ai-agent, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent]
suppressed_dims_count: 2
decisions_entry: D31
```

### Phase 8 — Export and draft UI

```yaml
phase: 8
types: [user-facing, client-state, web]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 8
decisions_entry: D32
```

## Scope

### Phase 1
- **Modified:** `api/models/analysis.py`, `api/services/analysis.py`
- **New:** `api/services/audit.py`, `tests/api/test_audit.py`

### Phase 2
- **New:** `Dockerfile`, `railway.toml`, `.dockerignore`, `tests/api/test_config.py`, `tests/api/test_spa.py`
- **Modified:** `api/main.py` (SPA static serving), `api/config.py` (DATABASE_URL psycopg3 normalization)

### Phase 3
- **New:** `tests/e2e/conftest.py`, `tests/e2e/test_smoke.py`
- **Modified:** `pyproject.toml` (add playwright dependency)

### Phase 4
- **Modified:** `src/screens/Upload.tsx`

### Phase 5
- **Modified:** `api/models/document.py`, `api/services/documents.py`
- **New:** `tests/api/test_retention.py`

### Phase 6
- **New:** `api/services/export.py`, `tests/api/test_export.py`

### Phase 7
- **Modified:** `api/services/consumer_credit_provider.py`
- **New:** `api/services/draft.py`, `tests/api/test_draft.py`

### Phase 8
- **Modified:** `src/screens/Email.tsx`
- **New:** export/draft screen components

## Dependencies

- Phase 2 depends on Phase 1 (deploys existing codebase including audit work)
- Phase 3 depends on Phase 2 (needs deployed Railway URL for production-target smoke tests)
- Phase 4 depends on Phase 3 (E2E tests verify fact review flow before UX rework)
- Phase 5 is independent of Phase 4 (retention vs UI — parallel-safe)
- Phase 6 depends on Phase 1 (export references audit timeline fields)
- Phase 7 depends on Phase 6 (draft generation consumes selected+exported findings)
- Phase 8 depends on Phases 6 and 7 (UI needs both export and draft services)

## Risks

- **Railway ephemeral filesystem for uploads** — medium — uploaded documents stored on disk are lost on redeploy; mitigate by documenting limitation for MVP and planning volume mount or object storage upgrade
- **Draft generation crossing advice boundary (SR-01)** — high — B4 cautious language rules + deterministic post-filter that rejects advisory/prescriptive phrasing
- **Retention enforcement blocking dev workflow** — medium — default retention = active until manual delete; dev path unaffected
- **PENDING #4 analysis.py duplication grows with audit wiring** — low — resolved in Phase 1

## Notes

- REQ-12 acceptance: Draft/export generation refuses unsupported outputs and includes source references or inference metadata for every included claim.
- REQ-13 acceptance: Each run has an auditable timeline and no production path accepts real user documents without defined retention, deletion, access-control, and audit behavior.
- PENDING #4 (analysis.py duplicated setup) resolved in Phase 1 via extract to audit.py.
- Phase 5 red-line: AI/Agent structured output is non-negotiable (U4) — draft output must be a Pydantic model, not free-form text.
- Phase 2 Railway target: Pro plan ($20/mo), PostgreSQL 0.5 vCPU/512MB, FastAPI 0.5 vCPU/512MB with app sleeping, frontend 0.25 vCPU/256MB with app sleeping. Alembic migration runs as Railway pre-deploy command.

## Runtime Evidence Checkpoints

- Phase 2 (migration, rollout): Browser screenshot of deployed Railway URL showing the app loads and /api/health returns OK. Artifacts: `.kdbp/evidence/phase-2/`.
- Phase 3 (testing, integration): Playwright smoke test run against deployed Railway URL with pass/fail report and failure screenshots. Artifacts: `.kdbp/evidence/phase-3/`.
- Phase 4 (user-facing, client-state): Playwright browser test of fact review with bulk actions, category grouping, and stats strip visible. Artifacts: `.kdbp/evidence/phase-4/`.
- Phase 8 (user-facing, web): Playwright browser screenshots of export selection, draft preview, and copy/download actions. Target: Chromium via Python playwright. Artifacts: `.kdbp/evidence/phase-8/`.
