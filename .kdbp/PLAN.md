# Active Plan

<!-- status: active -->
<!-- project_type: code -->
<!-- goal: Normalize consumer-credit facts and add confirmation gate -->
<!-- created: 2026-05-15 -->
<!-- last_updated: 2026-05-15T16:30 -->

## Goal

Persist normalized Chilean consumer-credit facts from extracted document text and
require user confirmation before those facts can drive analysis or findings.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer.
- **Created:** 2026-05-15
- **Last Updated:** 2026-05-15
- **Roadmap coverage:** ROADMAP Phase 3 (`REQ-03`, `REQ-05`) building on the
  completed document ingestion and extracted-text foundation from ROADMAP
  Phase 2.
- **Completed foundation:** persisted cases, document uploads, extracted text
  segments, document status, local storage metadata, and frontend upload/status
  handoff are already in place.

## Scope

### In

- Normalized consumer-credit fact records for high-impact fields.
- Provenance from normalized facts back to document/text segment/page/span,
  extraction provider, extraction date, and confidence when known.
- MVP deterministic extraction from existing extracted text segments for common
  Chilean consumer-credit fields.
- Fact status, warning, high-impact, and confirmation state.
- User confirmation, correction, and rejection of extracted facts.
- API endpoints to list fact candidates and record confirmation decisions.
- Frontend fact review screen/state before prototype analysis continues.
- Documentation updates for the new fact and confirmation boundary.

### Out

- OCR provider integration for scanned PDFs or images.
- LLM-based extraction or `ConsumerCreditAgent` execution.
- Deterministic discrepancy findings, official benchmark lookup, or market
  comparison output.
- Before-signing/after-signing path-specific findings.
- Evidence export, communication drafts, production auth, and public document
  serving.

## Phases

| # | Phase | Description | Types | Tier | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|-------|------|------------|------|--------|--------|------|
| 1 | Fact contract and schema | Add normalized fact and confirmation persistence contracts, schemas, migration, and architecture docs. | `persistence, data-migration, data-validation` | mvp | high | ✅ | ✅ | ✅ | ✅ |
| 2 | MVP fact extraction service | Extract common high-impact consumer-credit facts from stored text segments with provenance and warnings. | `persistence, extraction, data-processing` | mvp | high | ✅ | ✅ | ✅ | ✅ |
| 3 | Confirmation API and analysis gate | Expose owner-scoped fact review/confirmation endpoints and block downstream analysis until high-impact facts are confirmed or rejected. | `api, user-facing, data-validation` | mvp | med | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | Frontend fact review handoff | Add a fact confirmation screen/state with source snippets, correction controls, status summaries, and prototype-analysis guardrails. | `user-facing, client-state` | mvp | med | ⬜ | ⬜ | ⬜ | ⬜ |

<!-- Exec is written by /gabe-execute: ⬜ not started, 🔄 in progress, ✅ complete -->
<!-- Review/Commit/Push auto-ticked by /gabe-review, /gabe-commit, /gabe-push -->
<!-- A phase is complete when all four status columns are ✅ -->
<!-- /gabe-next routes to the next command based on column state -->
<!-- Tier column values: mvp | ent | scale, with compact per-dim overrides when needed. -->

## Phase Details

### Phase 1 — Fact contract and schema

```yaml
phase: 1
types: [persistence, data-migration, data-validation]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data]
suppressed_dims_count: 5
decisions_entry: D8
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/models/extraction.py`,
  `api/migrations/versions/*`, `api/schemas/documents.py`,
  `api/schemas/facts.py`, `docs/architecture.md`.
- **Acceptance:** migrations create normalized fact and confirmation tables with
  source document/text locator constraints; schemas can represent extracted,
  corrected, confirmed, rejected, and pending high-impact facts without creating
  findings.
- **Trade-offs accepted:** See `DECISIONS.md` D8.

### Phase 2 — MVP fact extraction service

```yaml
phase: 2
types: [persistence, extraction, data-processing]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data, Background jobs]
suppressed_dims_count: 6
decisions_entry: D9
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/services/fact_extraction.py`,
  `api/services/documents.py`, `api/models/extraction.py`,
  `api/schemas/facts.py`, `tests/api/test_fact_extraction.py`.
- **Acceptance:** extracted text can produce persisted fact candidates for
  amount, currency, dates, term, payment count, installment amount, rates/CAE,
  total cost, fees/insurance/linked-product signals, and relevant clause
  snippets when detectable; skipped/ambiguous fields remain visible as warnings
  rather than invented values.
- **Trade-offs accepted:** See `DECISIONS.md` D9.

### Phase 3 — Confirmation API and analysis gate

```yaml
phase: 3
types: [api, user-facing, data-validation]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data, UI/UX]
suppressed_dims_count: 5
decisions_entry: D10
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/routes/documents.py`, `api/routes/cases.py`,
  `api/services/facts.py`, `api/schemas/facts.py`,
  `tests/api/test_facts_api.py`.
- **Acceptance:** clients can list owner-scoped fact candidates, confirm,
  correct, or reject each high-impact fact, and receive a case-level readiness
  state that blocks analysis while required facts are unresolved.
- **Trade-offs accepted:** See `DECISIONS.md` D10.

### Phase 4 — Frontend fact review handoff

```yaml
phase: 4
types: [user-facing, client-state]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 6
decisions_entry: D11
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `src/api/facts.ts`, `src/screens/Upload.tsx`,
  `src/screens/Detection.tsx`, `src/components/NavContext.tsx`,
  `tests/frontend/Upload.test.tsx`, `docs/V0_ALIGNMENT.md`.
- **Acceptance:** after upload/extraction, users can review high-impact fact
  candidates with source snippets, confirm/correct/reject them, see unresolved
  fact counts, and cannot continue into prototype analysis as if unconfirmed
  facts were evidence-backed findings.
- **Trade-offs accepted:** See `DECISIONS.md` D11.

## Current Phase

Phase 2: MVP fact extraction service

## Dependencies

- Phase 1 establishes the storage and schema contract for all later fact work.
- Phase 2 depends on Phase 1 and the existing extracted text segments.
- Phase 3 depends on Phase 1 fact/confirmation records and Phase 2 candidate
  generation.
- Phase 4 depends on Phase 3 API readiness and confirmation contracts.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Regex or heuristic extraction invents facts from weak text matches. | high | Store candidates with confidence/warnings and leave ambiguous values unresolved instead of fabricating normalized values. |
| Unconfirmed facts leak into analysis screens as trusted findings. | high | Add API readiness state and frontend guardrails before prototype analysis continues. |
| Provenance becomes too weak for later findings. | high | Require document id plus page or text span locator for each uploaded-document fact. |
| Fact schema overfits one sample contract. | medium | Keep keys explicit but extensible, add fixtures for common Chilean consumer-credit labels, and document deferred fields. |
| Confirmation edits overwrite extraction evidence. | medium | Preserve original extraction values separately from user-confirmed values with actor/timestamp. |

## Notes

- This plan intentionally stops before `ConsumerCreditAgent`, deterministic
  discrepancy findings, benchmark catalogs, and export/draft generation.
- MVP extraction can be deterministic and conservative; low-confidence or
  missing fields should become confirmation prompts, not inferred conclusions.
- Scanned uploads that are `needs_ocr` remain pending until an OCR provider plan
  exists.
