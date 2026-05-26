# Active Plan

<!-- status: active -->
<!-- project_type: code -->
<!-- goal: Build the consumer-credit analysis engine with stable structured output, deterministic discrepancy checks, official references, and evidence-backed finding presentation -->
<!-- created: 2026-05-18 -->
<!-- last_updated: 2026-05-26 -->

## Goal

Build the first real consumer-credit analysis engine so confirmed facts can
produce stable structured analysis, deterministic discrepancies, bounded
official references, and evidence-backed findings without turning unsupported
outputs into trusted results.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer.
- **Created:** 2026-05-18
- **Last Updated:** 2026-05-18
- **Roadmap coverage:** ROADMAP Phase 4 (`REQ-06`, `REQ-07`, `REQ-08`,
  `REQ-11`) building on completed case intake, document ingestion, fact
  extraction, and fact confirmation.
- **Completed foundation:** persisted cases, uploaded documents, extracted text
  segments, normalized pending fact candidates, confirmation/correction/rejection
  records, and case readiness gates are already in place.

## Scope

### In

- Stable `ConsumerCreditAnalysis` schemas with explicit schema versions.
- Analysis run, finding, citation/evidence, calculation, and unsupported-output
  persistence contracts.
- A separate `DocumentReceptionistAgent` gate before discrepancy calculations,
  with structured observations, bounded document media, deterministic gap
  comparison, and human resolution.
- Persisted receptionist runs, observations, extraction gaps, and resolution
  audit records.
- Composite `analysis-readiness` that combines fact-layer readiness with
  unresolved receptionist blockers.
- Deterministic calculations for core consumer-credit discrepancies, including
  the 60-versus-68-payment scenario.
- A bounded official/reference catalog for CMF, SERNAC, Ley Chile, and
  benchmark/reference labels.
- `ConsumerCreditAgent` orchestration with mechanically enforced structured
  output and run metrics.
- API endpoints to start/read analysis and inspect evidence-backed findings.
- Frontend handoff from confirmed facts into source-inspectable findings.
- Documentation updates for analysis schemas, services, endpoints, agents, and
  the evidence boundary.

### Out

- Before-signing path-specific negotiation/comparison workflow beyond the
  general analysis engine.
- After-signing recourse/escalation workflow beyond deterministic discrepancy
  evidence.
- Evidence export, communication drafts, production retention policy, and real
  auth/authorization.
- Broad legal-document support or dynamic per-user agent output shapes.
- Letting receptionist observations mutate trusted facts without deterministic
  comparison and human resolution.
- Giving the later `ConsumerCreditAgent` raw uploaded documents.
- Production multimodal provider routing, fallback chains, or external
  observability beyond locally persisted run metadata.
- Live external scraping at runtime unless explicitly bounded behind the
  reference catalog contract.

## Phases

| # | Phase | Description | Types | Tier | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|-------|------|------------|------|--------|--------|------|
| 1 | Analysis contract and persistence | Add analysis run, finding, citation/evidence, calculation, unsupported-output, and stable schema contracts. | `persistence, data-migration, data-validation` | mvp | high | ✅ | ✅ | ✅ | ✅ |
| 2 | Receptionist schema, persistence, and provider contract | Add `DocumentReceptionistAgent` output schema, audit tables, config, dependency contract, and fail-closed provider adapter. | `persistence, data-migration, ai-agent, data-validation` | ent | high | ✅ | ✅ | ✅ | ✅ |
| 3 | Multimodal media packing and run pipeline | Pack text, image, and bounded PDF page images, run the receptionist, and persist run/observation metadata. | `data-processing, ai-agent, file-io` | ent | high | ✅ | ✅ | ✅ | ✅ |
| 4 | Gap comparator, resolution, promotion, and composite readiness | Compare deterministic facts to receptionist observations, block high-risk gaps, resolve human decisions, promote accepted observations, and expose composite readiness. | `api, data-validation, data-processing` | ent | high | ✅ | ✅ | ✅ | ✅ |
| 5 | Frontend gap review handoff | Add the Upload-screen receptionist review surface, run controls, gap actions, and composite readiness gate. | `user-facing, client-state, api` | mvp | med | ✅ | ✅ | ✅ | ✅ |
| 6 | Deterministic discrepancy calculations | Compute reproducible consumer-credit discrepancy evidence from confirmed facts and comparison inputs. | `data-processing, data-validation` | mvp | high | ✅ | ✅ | ✅ | ✅ |
| 7 | Official reference catalog | Add bounded CMF, SERNAC, Ley Chile, and benchmark reference records with retrieval/verification metadata. | `persistence, external-api, data-validation` | mvp | med | ✅ | ✅ | ✅ | ⬜ |
| 8 | Structured agent orchestration | Implement `ConsumerCreditAgent` and analysis-run orchestration with enforced output shape, readiness gating, and run metrics. | `ai-agent, llm, async-worker, data-processing` | ent | high | ⬜ | ⬜ | ⬜ | ⬜ |
| 9 | Analysis API and source inspection UI | Expose analysis/finding endpoints and replace prototype findings with source-inspectable evidence states. | `api, user-facing, client-state` | mvp | high | ⬜ | ⬜ | ⬜ | ⬜ |

<!-- Exec is written by /gabe-execute: ⬜ not started, 🔄 in progress, ✅ complete -->
<!-- Review/Commit/Push auto-ticked by /gabe-review, /gabe-commit, /gabe-push -->
<!-- A phase is complete when all four status columns are ✅ -->
<!-- /gabe-next routes to the next command based on column state -->
<!-- Tier column values: mvp | ent | scale, with compact per-dim overrides when needed. -->

## Phase Details

### Phase 1 — Analysis contract and persistence

```yaml
phase: 1
types: [persistence, data-migration, data-validation]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data]
suppressed_dims_count: 1
decisions_entry: D12
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/models/analysis.py`,
  `api/migrations/versions/*`, `api/schemas/analysis.py`,
  `api/schemas/__init__.py`, `docs/architecture.md`.
- **Acceptance:** persistence and schemas can represent versioned analysis runs,
  stable `ConsumerCreditAnalysis`, findings, claim types, citations,
  deterministic calculation evidence, reference evidence, inference metadata,
  and unsupported outputs without allowing unsupported output into trusted
  findings.
- **Roadmap acceptance covered:** REQ-06 stable schema foundation, REQ-11
  finding evidence contract, and REQ-04 claim-classification continuity.
- **Trade-offs accepted:** See `DECISIONS.md` D12.

### Phase 2 — Receptionist schema, persistence, and provider contract

```yaml
phase: 2
types: [persistence, data-migration, ai-agent, data-validation]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, Data, AI/Agent]
suppressed_dims_count: 3
decisions_entry: D17
```

- **Tier chosen:** `ent` because the receptionist is an LLM-shaped trust
  boundary whose output can block analysis and promote facts only after review.
- **Prototype:** no.
- **Likely files:** `api/models/receptionist.py`,
  `api/migrations/versions/*`, `api/schemas/receptionist.py`,
  `api/services/receptionist_provider.py`, `api/config.py`,
  `pyproject.toml`, `docs/AGENTS_USE.md`, `docs/architecture.md`.
- **Acceptance:** persisted receptionist runs, observations, gaps, and
  resolutions exist; provider/model/page/timeout/enabled settings are
  documented; the default fake provider is deterministic for local tests; any
  unsupported external provider fails closed into a blocking run/gap state.
- **Roadmap acceptance covered:** pre-analysis raw-document verification gate
  before deterministic discrepancy calculations.
- **Trade-offs accepted:** See `DECISIONS.md` D17.

### Phase 3 — Multimodal media packing and run pipeline

```yaml
phase: 3
types: [data-processing, ai-agent, file-io]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent, Data]
suppressed_dims_count: 3
decisions_entry: D18
```

- **Tier chosen:** `ent` because raw document access is intentionally narrow
  and must be bounded by media packing and run metadata.
- **Prototype:** no.
- **Likely files:** `api/services/receptionist_media.py`,
  `api/services/receptionist.py`, `api/routes/receptionist.py`,
  `tests/api/test_receptionist_media.py`, `tests/api/test_receptionist_api.py`.
- **Acceptance:** plain text runs on extracted text; image uploads pass as
  image media; PDFs render bounded page images; too-many-pages, missing files,
  malformed documents, provider timeouts, invalid output, and unavailable
  providers are represented as deterministic run/gap states.
- **Roadmap acceptance covered:** multimodal receptionist input pipeline and
  provider-unavailable/partial-document readiness behavior.
- **Trade-offs accepted:** See `DECISIONS.md` D18.

### Phase 4 — Gap comparator, resolution, promotion, and composite readiness

```yaml
phase: 4
types: [api, data-validation, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, Data, API]
suppressed_dims_count: 2
decisions_entry: D19
```

- **Tier chosen:** `ent` because this phase decides which LLM-side differences
  can block analysis and which human decisions may mutate trusted facts.
- **Prototype:** no.
- **Likely files:** `api/services/receptionist.py`,
  `api/routes/receptionist.py`, `api/schemas/receptionist.py`,
  `tests/api/test_receptionist_api.py`.
- **Acceptance:** deterministic comparison emits missing-field, value-conflict,
  source-conflict, warning-resolved, unanchored-claim, unsupported-field,
  failed-run, and partial-document gaps; high-risk gaps block
  `analysis-readiness`; accepted missing known facts create
  `ConsumerCreditFact` rows with `extraction_provider="receptionist-agent-v1"`;
  accepted conflicts correct existing facts through confirmation records;
  unsupported/rejected observations do not mutate facts.
- **Roadmap acceptance covered:** receptionist gap analysis, human resolution,
  deterministic promotion, and composite analysis readiness.
- **Trade-offs accepted:** See `DECISIONS.md` D19.

### Phase 5 — Frontend gap review handoff

```yaml
phase: 5
types: [user-facing, client-state, api]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 4
decisions_entry: D20
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `src/api/receptionist.ts`, `src/screens/Upload.tsx`,
  `tests/frontend/Upload.test.tsx`.
- **Acceptance:** the upload flow can run/re-run receptionist review per
  document, show run/gap status, resolve gaps with explicit actions, and block
  prototype progression on composite readiness rather than fact-layer readiness
  alone.
- **Roadmap acceptance covered:** human gap review handoff before analysis.
- **Trade-offs accepted:** See `DECISIONS.md` D20.

### Phase 6 — Deterministic discrepancy calculations

```yaml
phase: 6
types: [data-processing, data-validation]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core]
suppressed_dims_count: 0
decisions_entry: D13
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/services/calculations.py`,
  `api/services/analysis.py`, `api/schemas/analysis.py`,
  `tests/api/test_consumer_credit_calculations.py`,
  `docs/architecture.md`.
- **Acceptance:** confirmed facts can produce deterministic calculation evidence
  for payment-count mismatches, total paid, installment amount, term, rate/CAE,
  fees, insurance, and linked-product signals where inputs exist; the
  60-versus-68-payment scenario produces a reproducible discrepancy finding
  backed by fact ids and calculation details.
- **Roadmap acceptance covered:** REQ-07 deterministic calculations and
  discrepancy checks.
- **Trade-offs accepted:** See `DECISIONS.md` D13.

### Phase 7 — Official reference catalog

```yaml
phase: 7
types: [persistence, external-api, data-validation]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data, Integration]
suppressed_dims_count: 4
decisions_entry: D14
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/models/reference.py`,
  `api/migrations/versions/*`, `api/schemas/references.py`,
  `api/services/references.py`, `docs/architecture.md`,
  `tests/api/test_references.py`.
- **Acceptance:** reference records can store CMF, SERNAC, Ley Chile, and
  benchmark source URL, retrieval date, verification date when verified,
  display label, source category, and marketplace-safe labels that distinguish
  benchmarks from personalized offers.
- **Roadmap acceptance covered:** REQ-08 official source and benchmark catalog.
- **Trade-offs accepted:** See `DECISIONS.md` D14.

### Phase 8 — Structured agent orchestration

```yaml
phase: 8
types: [ai-agent, llm, async-worker, data-processing]
phase_tier: ent
prototype: false
dim_overrides: []
sections_considered: [Core, AI/Agent, Background jobs]
suppressed_dims_count: 3
decisions_entry: D15
```

- **Tier chosen:** `ent` because structured output and run measurement are
  load-bearing for trusted analysis.
- **Prototype:** no.
- **Likely files:** `api/agents/consumer_credit.py`,
  `api/schemas/analysis.py`, `api/services/analysis.py`,
  `api/routes/analysis.py`, `api/main.py`,
  `tests/api/test_consumer_credit_agent.py`, `docs/AGENTS_USE.md`,
  `docs/architecture.md`.
- **Acceptance:** `ConsumerCreditAgent` consumes confirmed facts, calculation
  evidence, selected references, and schema version; it returns the full stable
  `ConsumerCreditAnalysis` shape through framework-level structured output;
  analysis refuses unresolved readiness, records status/cost/latency/token
  metadata where available, and stores unsupported outputs only for audit/debug.
- **Roadmap acceptance covered:** REQ-06 structured agent, REQ-11 inference
  metadata, and REQ-13 run-observability continuity for analysis runs.
- **Trade-offs accepted:** See `DECISIONS.md` D15.

### Phase 9 — Analysis API and source inspection UI

```yaml
phase: 9
types: [api, user-facing, client-state]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State]
suppressed_dims_count: 5
decisions_entry: D16
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/routes/analysis.py`, `api/services/analysis.py`,
  `api/schemas/analysis.py`, `src/api/analysis.ts`,
  `src/screens/Detection.tsx`, `src/screens/Plan.tsx`,
  `src/components/NavContext.tsx`, `tests/api/test_analysis_api.py`,
  `tests/frontend/Detection.test.tsx`, `docs/V0_ALIGNMENT.md`.
- **Acceptance:** clients can start/read analysis, list findings, open evidence
  trails, distinguish fact/calculation/reference/inference/unsupported-output
  states, see uncertainty/missing-context blockers, and cannot proceed through
  prototype findings as if they were evidence-backed analysis.
- **Roadmap acceptance covered:** REQ-11 finding presentation and source
  inspection.
- **Runtime evidence:** run a browser smoke of case setup -> upload -> fact
  confirmation -> analysis -> finding source inspection against local API and
  capture screenshots under a phase evidence directory before Exec can be ✅.
- **Trade-offs accepted:** See `DECISIONS.md` D16.

## Current Phase

Phase 7: Official reference catalog.

## Dependencies

- Phase 1 establishes the persisted analysis and evidence contract for every
  later phase.
- Phase 2 depends on the existing document/fact tables and introduces the
  separate receptionist audit contract.
- Phase 3 depends on Phase 2 because the run pipeline writes to the receptionist
  audit tables and uses the provider contract.
- Phase 4 depends on Phases 2-3 because deterministic comparison and promotion
  need persisted observations and runs.
- Phase 5 depends on Phase 4 because the UI should resolve persisted gaps and
  read composite readiness.
- Phase 6 depends on Phases 2-5 because discrepancy calculations should only
  use facts after receptionist blockers are resolved.
- Phase 7 depends on Phase 1 because reference evidence needs the same claim
  and citation model.
- Phase 8 depends on Phases 1, 6, and 7 because the agent should consume confirmed
  facts, deterministic calculations, and bounded references rather than raw
  uploaded text.
- Phase 9 depends on Phases 1, 6, 7, and 8 because the UI should read persisted analysis
  runs and evidence trails instead of prototype-only state.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Agent output shape drifts by prompt or UI preference. | high | Define stable Pydantic schemas first and use framework-level structured output enforcement. |
| Findings appear before facts are confirmed. | high | Keep the readiness gate in the analysis service and add negative tests that unresolved facts block analysis. |
| Receptionist observations get treated as trusted facts without review. | high | Persist them as observations/gaps only; promotion requires deterministic gap type checks and a human resolution record. |
| Multimodal runs silently review only part of a PDF. | high | Cap rendered pages, persist page counts, emit partial-document blocking gaps, and expose them in readiness. |
| Provider outage creates a false sense of readiness. | high | Fail closed with `receptionist_unavailable` blocking gaps and failed run status. |
| Deterministic findings overclaim weak inputs. | high | Store calculation evidence and uncertainty/missing-input blockers separately from trusted findings. |
| Official references look like personalized offers. | high | Store source category and display labels that distinguish benchmarks/rules from provider offers. |
| Long analysis work leaves the user waiting without state. | medium | Persist analysis run status and show progress/status in the UI before adding richer streaming. |
| Schema grows too generic for future document types. | medium | Keep `ConsumerCreditAnalysis` document-specific and use only shared primitives for citations, money, confidence, and next actions. |

## Notes

- This plan is Roadmap Phase 4 only; before-signing and after-signing
  path-specific workflows remain Roadmap Phases 5 and 6.
- The current prototype analysis screens are reference surfaces. They should not
  become evidence-backed until the analysis API and source inspection UI are in
  place.
- `DocumentReceptionistAgent` is the only current raw-document agent boundary.
  The later `ConsumerCreditAgent` still consumes confirmed facts, calculations,
  and references.
- External references can start as a bounded seeded catalog; live retrieval,
  refresh jobs, and production verification policy can be expanded later.
- Production retention/deletion and export/draft behavior remain Roadmap Phase 7.

## Runtime Evidence Checkpoints

- **Phase 9:** run backend and frontend locally, create a consumer-credit case,
  upload a text fixture, confirm required facts, start analysis, open a finding,
  and capture source-inspection screenshots plus the API transcript under a
  phase evidence directory.
- **Regression bundle before phase closure:** `uv run pytest`, `npm test`,
  `npm run lint`, `npm run build`, and `git diff --check`.
