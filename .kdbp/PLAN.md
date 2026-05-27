# Active Plan

<!-- status: active -->
<!-- project_type: code -->

## Goal

After-Signing Discrepancy Path — Roadmap Phase 6 (REQ-10): compare signed contract against uploaded offers, simulations, payments, or comparator loans; organize discrepancy evidence for clarification or escalation; central use case is the 60-vs-68 payment discovery after signing.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer
- **Created:** 2026-05-27
- **Last Updated:** 2026-05-28


## Phases

| # | Phase | Description | Tier | Types | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|------|-------|------------|------|--------|--------|------|
| 1 | After-signing deterministic analysis service | Create after_signing.py with discrepancy evidence enrichment, missing comparison context detection, and escalation questions; wire into analysis.py | ent | data-processing, data-validation | medium | ✅ | ✅ | ✅ | ✅ |
| 2 | After-signing agent enrichment | Enhance FakeConsumerCreditProvider's after-signing branch with richer discrepancy findings, comparison context summaries, and escalation-ready structure | ent | ai-agent, data-processing | low | ✅ | ⬜ | ⬜ | ⬜ |
| 3 | After-signing UI presentation and docs | Path-aware after-signing grouped layout in AnalysisResults.tsx with discrepancy-focused language; update architecture docs | ent | user-facing, client-state, web | medium | ⬜ | ⬜ | ⬜ | ⬜ |

<!-- Exec is written by /gabe-execute: ⬜ not started, 🔄 in progress, ✅ complete -->
<!-- Review/Commit/Push auto-ticked by /gabe-review, /gabe-commit, /gabe-push -->
<!-- A phase is complete when all four status columns are ✅ -->
<!-- /gabe-next routes to the next command based on column state (Exec → Review → Commit → Push → advance phase) -->
<!-- Tier column values: mvp | ent | scale. Read by /gabe-execute (tier-cap) and /gabe-review (TIER_DRIFT finding). -->
<!-- User-facing/runtime phase types require journey evidence artifacts before Exec can be ✅. -->
<!-- Manual override is fine — edit cells by hand any time -->
<!-- Legacy plans with a single Status column still work; auto-tick is a silent no-op -->
<!-- Legacy plans without Tier column: /gabe-execute reads tier=mvp default; /gabe-review skips TIER_DRIFT silently -->

## Phase Details

### Phase 1 — After-signing deterministic analysis service

```yaml
phase: 1
types: [data-processing, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D25
```

- **Tier chosen:** ent
- **Prototype:** no
- **Sections considered:** Core
- **Suppressed dims:** 0
- **See DECISIONS.md D25 for accepted trade-offs.**

### Phase 2 — After-signing agent enrichment

```yaml
phase: 2
types: [ai-agent, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent]
suppressed_dims_count: 3
decisions_entry: D26
```

- **Tier chosen:** ent
- **Prototype:** no
- **Sections considered:** Core, AI/Agent
- **Suppressed dims:** 3 (see D26 for full list)
- **See DECISIONS.md D26 for accepted trade-offs.**

### Phase 3 — After-signing UI presentation and docs

```yaml
phase: 3
types: [user-facing, client-state, web]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 7
decisions_entry: D27
```

- **Tier chosen:** ent
- **Prototype:** no
- **Sections considered:** Core, UI/UX, Client State
- **Suppressed dims:** 7 (see D27 for full list)
- **See DECISIONS.md D27 for accepted trade-offs.**

## Current Phase

Phase 2: After-signing agent enrichment

## Scope

### Phase 1
- **Modified:** `api/services/analysis.py`
- **New:** `api/services/after_signing.py`, `tests/api/test_after_signing.py`

### Phase 2
- **Modified:** `api/services/consumer_credit_provider.py`, `tests/api/test_consumer_credit_agent.py`

### Phase 3
- **Modified:** `src/screens/AnalysisResults.tsx`, `docs/architecture.md`

## Dependencies

- Phase 2 depends on Phase 1 (agent findings must align with deterministic enrichment structure)
- Phase 3 depends on Phase 2 (UI needs finalized finding key namespace and grouping structure)

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cross-document comparison limited by FakeProvider — comparison doc facts require separate extraction runs | medium | Scope to detecting comparison document presence via document metadata, not full cross-doc fact extraction |
| PENDING #4 duplication in analysis.py increases with second path-specific block | low | Keep enrichment blocks path-specific and small; Scale-tier consolidation remains deferred |
| Finding key namespace collision between as_ and existing specs | low | Audit existing keys before committing; as_ prefix unused in current codebase |

## Notes

- REQ-10 acceptance signal: An after-signing case can show discrepancies, missing context, and relevant entities or information-request paths without advising the user what decision to make.
- Central use case: 60-vs-68 payment discovery after signing.
- After-signing finding key namespace: `as_` prefix (parallel to before-signing's `bs_` prefix).
- PENDING items #3 and #4 touch files in scope — both are Scale-tier deferred, not blocking.

## Runtime Evidence Checkpoints

- Phase 3 (user-facing, web): Playwright browser screenshots of after-signing grouped layout showing discrepancies, comparison context, missing info, and escalation paths. Target: Chromium via Python playwright. Artifacts: `.kdbp/evidence/phase-3/`.
