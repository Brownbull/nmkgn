# Active Plan

<!-- status: active -->
<!-- project_type: code -->

## Goal

Evidence Export, Audit, and Production Guardrails — Roadmap Phase 7 (REQ-12, REQ-13): generate exportable summaries and editable communication drafts from user-selected evidence-backed findings (refusing unsupported outputs); track run state, progress, cost, token use, latency, extraction warnings, suppressed findings, retention/deletion status with auditable timelines.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer
- **Created:** 2026-05-27
- **Last Updated:** 2026-05-27

## Current Phase

Phase 1: Run audit timeline and observability

## Phases

| # | Phase | Description | Tier | Types | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|------|-------|------------|------|--------|--------|------|
| 1 | Run audit timeline and observability | Wire run-level audit fields (status lifecycle, token counts, cost, latency, warnings, suppressed findings) into the analysis service with structured timeline events | ent | data-processing, data-validation | medium | ✅ | ✅ | ✅ | ⬜ |
| 2 | Document retention and access guardrails | Enforce retention_state transitions (active → delete_requested → deleted), owner-scoped access checks, and audit logging for document lifecycle events | ent | data-processing, data-validation | medium | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | Finding selection and export service | Build export service that accepts user-selected finding IDs, validates each has evidence backing, assembles exportable summary with source references, and refuses unsupported outputs | ent | data-processing | medium | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | Communication draft generation | Add draft generation service using PydanticAI to produce editable communication drafts from selected findings with B4-compliant cautious language and deterministic post-filter | ent (Str.out→ent, Cost→ent) | ai-agent, data-processing | medium | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | Export and draft UI | Replace Email.tsx mockup with real export/draft screens: finding selection checkboxes, export preview, draft generation trigger, editable draft editor, and copy/download actions | ent | user-facing, client-state, web | high | ⬜ | ⬜ | ⬜ | ⬜ |

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

### Phase 2 — Document retention and access guardrails

```yaml
phase: 2
types: [data-processing, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D29
```

### Phase 3 — Finding selection and export service

```yaml
phase: 3
types: [data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D30
```

### Phase 4 — Communication draft generation

```yaml
phase: 4
types: [ai-agent, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent]
suppressed_dims_count: 2
decisions_entry: D31
```

### Phase 5 — Export and draft UI

```yaml
phase: 5
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
- **Modified:** `api/models/document.py`, `api/services/documents.py`
- **New:** `tests/api/test_retention.py`

### Phase 3
- **New:** `api/services/export.py`, `tests/api/test_export.py`

### Phase 4
- **Modified:** `api/services/consumer_credit_provider.py`
- **New:** `api/services/draft.py`, `tests/api/test_draft.py`

### Phase 5
- **Modified:** `src/screens/Email.tsx`
- **New:** export/draft screen components

## Dependencies

- Phase 2 is independent of Phase 1 (retention vs audit — parallel-safe)
- Phase 3 depends on Phase 1 (export references audit timeline fields)
- Phase 4 depends on Phase 3 (draft generation consumes selected+exported findings)
- Phase 5 depends on Phases 3 and 4 (UI needs both export and draft services)

## Risks

- **Draft generation crossing advice boundary (SR-01)** — high — B4 cautious language rules + deterministic post-filter that rejects advisory/prescriptive phrasing
- **Retention enforcement blocking dev workflow** — medium — default retention = active until manual delete; dev path unaffected
- **PENDING #4 analysis.py duplication grows with audit wiring** — low — fold fix into Phase 1

## Notes

- REQ-12 acceptance: Draft/export generation refuses unsupported outputs and includes source references or inference metadata for every included claim.
- REQ-13 acceptance: Each run has an auditable timeline and no production path accepts real user documents without defined retention, deletion, access-control, and audit behavior.
- PENDING #4 (analysis.py duplicated setup) is in scope for Phase 1 — resolve while wiring audit into the analysis service.
- Phase 4 red-line: AI/Agent structured output is non-negotiable (U4) — draft output must be a Pydantic model, not free-form text.

## Runtime Evidence Checkpoints

- Phase 5 (user-facing, web): Playwright browser screenshots of export selection, draft preview, and copy/download actions. Target: Chromium via Python playwright. Artifacts: `.kdbp/evidence/phase-5/`.
