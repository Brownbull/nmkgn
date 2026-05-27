# Active Plan

<!-- status: active -->
<!-- project_type: code -->
<!-- goal: Provide a before-signing analysis path with key terms, bounded comparisons, negotiation questions, and missing information -->
<!-- created: 2026-05-26 -->
<!-- last_updated: 2026-05-26 -->

## Goal

Provide a before-signing analysis path that highlights key terms, bounded
market/reference comparisons, negotiation questions, missing information, and
provider questions without presenting guaranteed offers.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer.
- **Created:** 2026-05-26
- **Last Updated:** 2026-05-27
- **Roadmap coverage:** ROADMAP Phase 5 (`REQ-09`) building on completed
  analysis engine (Phase 4), reference catalog, and deterministic calculations.
- **Completed foundation:** persisted cases, uploaded documents, extracted text
  segments, confirmed facts, analysis runs with evidence chains, deterministic
  discrepancy calculations, official reference catalog (CMF, SERNAC, Ley Chile,
  benchmark), structured agent orchestration, and source-inspectable findings UI.

## Scope

### In

- Path-aware analysis routing that branches on `analysis_plan` (before_signing_review
  vs after_signing_discrepancy).
- Before-signing finding types: key term highlights, reference comparisons,
  negotiation questions, missing information prompts.
- Deterministic before-signing checks: compare contract terms against reference
  catalog benchmarks (rate vs CMF max, CAE vs market avg, fees vs law limits).
- Missing information detection: surface absent or unconfirmed facts as explicit
  findings rather than silently skipping comparisons.
- Before-signing agent provider that synthesizes bounded comparisons and
  contextual questions using cautious language.
- Path-specific UI: questions-first grouping, key term highlights with benchmark
  context, missing context as intake prompts.

### Out

- After-signing discrepancy path (Roadmap Phase 6, REQ-10).
- User-uploaded comparison documents (simulation, alternate offer) — that intake
  belongs to after-signing or a future comparison-input phase.
- Live external reference fetching or refresh jobs.
- Evidence export, communication drafts, retention policy (Roadmap Phase 7).
- Production auth/authorization.
- Expanding beyond Chilean consumer-credit document type.

## Phases

| # | Phase | Description | Types | Tier | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|-------|------|------------|------|--------|--------|------|
| 1 | Path-aware routing and before-signing schemas | Wire `analysis_plan` into the analysis service so it branches on before/after signing; add before-signing finding types. | `data-validation, api` | ent | med | ✅ | ✅ | ✅ | ✅ |
| 2 | Before-signing deterministic analysis | Extract key terms from confirmed facts, compare against reference catalog benchmarks, detect missing inputs, and generate negotiation questions from reference gaps. | `data-processing, data-validation` | ent | high | ✅ | ✅ | ✅ | ✅ |
| 3 | Before-signing agent orchestration | Add a path-aware provider that synthesizes bounded comparisons and contextual questions from confirmed facts, deterministic checks, and references using cautious before-signing language. | `ai-agent, data-processing` | ent | high | ✅ | ⬜ | ⬜ | ⬜ |
| 4 | Before-signing UI and finding presentation | Replace the generic finding display with a path-specific layout — questions-first grouping, key term highlights with benchmark context, missing context as intake prompts. | `user-facing, client-state, api` | ent | high | ⬜ | ⬜ | ⬜ | ⬜ |

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

### Phase 1 — Path-aware routing and before-signing schemas

```yaml
phase: 1
types: [data-validation, api]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D21
```

- **Tier chosen:** `ent`.
- **Prototype:** no.
- **Likely files:** `api/services/analysis.py`, `api/schemas/analysis.py`,
  `api/routes/analysis.py`, `tests/api/test_analysis_api.py`.
- **Acceptance:** analysis service branches on `analysis_plan`; before-signing
  runs produce finding types distinct from after-signing discrepancy findings;
  invalid or missing `analysis_plan` values are handled with typed errors.
- **Roadmap acceptance covered:** REQ-09 path-aware routing foundation.
- **Trade-offs accepted:** See `DECISIONS.md` D21.

### Phase 2 — Before-signing deterministic analysis

```yaml
phase: 2
types: [data-processing, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D22
```

- **Tier chosen:** `ent`.
- **Prototype:** no.
- **Likely files:** `api/services/before_signing.py`,
  `api/services/calculations.py`, `api/services/references.py`,
  `tests/api/test_before_signing.py`.
- **Acceptance:** key terms are extracted from confirmed facts with reference
  context; rate/CAE/fee/term comparisons against catalog produce bounded
  findings; missing or partial inputs produce explicit missing-info findings
  rather than silent omission; edge cases (zero values, missing references,
  partial facts) are covered.
- **Roadmap acceptance covered:** REQ-09 key terms and bounded comparisons.
- **Trade-offs accepted:** See `DECISIONS.md` D22.

### Phase 3 — Before-signing agent orchestration

```yaml
phase: 3
types: [ai-agent, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent]
suppressed_dims_count: 2
decisions_entry: D23
```

- **Tier chosen:** `ent`.
- **Prototype:** no.
- **Likely files:** `api/agents/consumer_credit.py`,
  `api/services/consumer_credit_provider.py`, `api/services/analysis.py`,
  `api/schemas/analysis.py`, `tests/api/test_consumer_credit_agent.py`.
- **Acceptance:** before-signing provider uses `output_type` enforcement;
  generates negotiation questions, provider questions, and bounded comparison
  summaries using cautious language; all claims cite reference catalog entries
  or confirmed facts; edge cases (no applicable references, all facts missing,
  provider failure) produce safe fallback findings.
- **Roadmap acceptance covered:** REQ-09 question generation and bounded
  comparison synthesis.
- **Trade-offs accepted:** See `DECISIONS.md` D23.

### Phase 4 — Before-signing UI and finding presentation

```yaml
phase: 4
types: [user-facing, client-state, api]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 5
decisions_entry: D24
```

- **Tier chosen:** `ent`.
- **Prototype:** no.
- **Likely files:** `src/screens/AnalysisResults.tsx`,
  `src/api/analysis.ts`, `src/components/NavContext.tsx`,
  `src/Proto.tsx`.
- **Acceptance:** before-signing findings display in questions-first layout;
  key term highlights show benchmark context; missing-info findings prompt
  user action; error states show inline recovery (not alert); loading uses
  spinner/skeleton; path-specific language is cautious throughout.
- **Roadmap acceptance covered:** REQ-09 finding presentation and source
  inspection for before-signing path.
- **Runtime evidence:** run a browser smoke of a before-signing case through
  upload, fact confirmation, analysis, and finding inspection. Capture
  screenshots under `.kdbp/evidence/phase-4/`.
- **Trade-offs accepted:** See `DECISIONS.md` D24.

## Current Phase

Phase 3: Before-signing agent orchestration.

## Dependencies

- Phase 2 depends on Phase 1 (routing must branch before generating
  path-specific findings).
- Phase 3 depends on Phase 2 (agent needs deterministic checks available as
  input alongside confirmed facts and references).
- Phase 4 depends on Phases 1-3 (UI needs all backend finding types to display).

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Reference catalog too thin for meaningful comparisons (only 5 seeded records) | high | Key term checks work with existing references; extend catalog with more CMF rate categories and fee limits if gaps emerge during Phase 2 |
| Comparison language drifts into advice ("you should negotiate") | high | Enforce B4 cautious language — "worth asking about", "worth confirming", "possible point to review" |
| Key term detection depends on fact extraction quality — missing facts = missing comparisons | medium | Surface missing info as explicit findings; don't silently skip terms that can't be compared |
| Before-signing findings look too similar to after-signing discrepancies | medium | Distinct finding_key prefix and UI grouping (questions vs violations); language layer separates the paths |

## Notes

- This plan is Roadmap Phase 5 only; after-signing discrepancy path remains
  Roadmap Phase 6 (REQ-10).
- The existing `analysis_plan` field on `Case` already stores
  `before_signing_review` or `after_signing_discrepancy` but is currently
  metadata-only — the analysis service ignores it.
- Before-signing comparisons use the existing bounded reference catalog (CMF
  rates, SERNAC, Ley Chile, market benchmark) — not user-uploaded alternatives.
- Cautious language is a product requirement (B4, SC-06, NG-01), not a polish
  item. It must be enforced in agent prompts, finding templates, and UI copy.

## Runtime Evidence Checkpoints

- **Phase 4:** create a before-signing case, upload a contract fixture, confirm
  required facts, run before-signing analysis, verify key term highlights,
  reference comparisons, negotiation questions, and missing-info prompts render
  correctly. Capture browser screenshots under `.kdbp/evidence/phase-4/`.
