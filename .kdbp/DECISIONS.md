# Architecture Decisions

| # | Date | Decision | Rationale | Alternatives Considered | Status | Review Trigger |
|---|------|----------|-----------|------------------------|--------|----------------|
| D1 | 2026-05-12 | V0 targets Chilean consumer-credit review with document-specific Pydantic agents | The loan scenario gives a concrete, high-value first slice and avoids unsafe generic legal-analysis claims | Broad legal-document analyzer; prompt-defined variable schemas; UI-only mockup continuation | active | First non-credit document type, backend schema design, or legal-advice boundary change |
| D2 | 2026-05-13 | Phase 1 tier is MVP with stub login, FastAPI under `api/`, PostgreSQL, and Alembic | Build the spine before the scanner: prove persisted case creation without auth, OCR, agents, or document storage | Enterprise auth-first setup; frontend-only local storage; backend under `backend/`; no migrations | active | Auth scope, DB migration strategy, or package layout change |
| D3 | 2026-05-13 | Local nmkgn development uses registered non-default ports | Parallel projects on this workstation may use common defaults; reserving project-specific ports reduces collisions | Default Vite `5173`, API `8000`, PostgreSQL `5432`; ad hoc per-session overrides | active | Any local service port change or new local endpoint |

<!-- Status: active / superseded / revisit -->

## D4 — Phase 1 tier: mvp (2026-05-14)

**Phase:** Storage contract and schema
**Types:** persistence, data-migration, upload, storage
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Build the document storage contract with Alembic and local storage first, while escalating retention metadata because real document records cannot be treated as disposable prototype state.

### Sections rendered

- Core (always)
- Data
- File/Media

### Dimensions suppressed (Layer 2 filter)

- File/Media.CDN — no public file serving in this phase.
- File/Media.Image pipeline — no image transformation; OCR/images remain pending.
- Data.Indexing — start with owner/case lookup needs only; tune if query shape grows.
- Data.Migration safety — covered by Alembic upgrade tests, not deployment dry-runs.
- Core.Abstractions — keep storage/extraction boundaries small until there is more than one provider.

### Per-dim tier overrides

```yaml
dim_overrides:
  - section: File/Media
    dim: Retention
    tier: ent
    reason: Real document records need retention metadata and a production guard before storage ships.
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 3, XL x 1, M x 2
- Load-bearing items skipped:
  - File/Media.Virus scan: accepted only because this is local/internal MVP storage; production upload acceptance must revisit this.
  - Data.Backup/restore: production backup/restore remains a guardrail before real user documents are accepted outside local development.

### Review trigger

- Escalate before any non-local deployment accepts user documents, before files are served back to users, or before retention/deletion behavior becomes user-visible.

### Status

- accepted

## D5 — Phase 2 tier: mvp (2026-05-14)

**Phase:** Backend ingestion API
**Types:** upload, storage, user-facing, persistence
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Direct multipart upload to the FastAPI app is enough for the next local MVP slice and keeps document ownership, validation, and persistence testable without object storage.

### Sections rendered

- Core (always)
- File/Media
- UI/UX
- Data

### Dimensions suppressed (Layer 2 filter)

- File/Media.CDN — uploaded documents are not publicly served.
- File/Media.Image pipeline — no image processing in this phase.
- UI/UX.Streaming — upload/extraction status can be polling or synchronous for MVP.
- Data.Backup/restore — production backup policy remains a release guardrail, not an upload endpoint task.
- Data.Indexing — basic owner/case queries only.
- Core.Abstractions — avoid provider registry until there is more than local storage.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 4, XL x 1, M x 2
- Load-bearing items skipped:
  - File/Media.Virus scan: accepted only for local/internal MVP; must escalate before public upload.

### Review trigger

- Escalate if upload limits exceed local direct-to-app constraints, if public users can upload, or if storage moves to object storage.

### Status

- accepted

## D6 — Phase 3 tier: mvp (2026-05-14)

**Phase:** Text extraction pipeline
**Types:** persistence, async-worker, data-migration
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Extracting text into persisted segments is the smallest real bridge from uploaded files to future facts; retries, queues, OCR providers, and normalized fact extraction stay out until text provenance is proven.

### Sections rendered

- Core (always)
- Data
- Background jobs

### Dimensions suppressed (Layer 2 filter)

- Background jobs.Scheduling — extraction runs immediately after upload for MVP.
- Background jobs.Concurrency — no worker pool until extraction volume requires it.
- Data.Indexing — defer search/full-text indexes until fact extraction needs them.
- Data.Backup/restore — production backup policy remains a release guardrail.
- Core.Abstractions — one extraction service is enough before multiple providers exist.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- XL x 2, L x 3, M x 2
- Load-bearing items skipped:
  - Background jobs.Dead-letter and Idempotency: accepted only because extraction is pure local compute and can be rerun from stored document bytes.

### Review trigger

- Escalate before adding OCR/LLM providers, background workers, retries, or any extraction output that drives user-visible findings.

### Status

- accepted

## D7 — Phase 4 tier: mvp (2026-05-14)

**Phase:** Frontend upload/status handoff
**Types:** user-facing, client-state, upload
**Tier chosen:** mvp
**Prototype:** no
**Reason:** A direct upload form with explicit persisted/extracted/pending states is enough to prove the flow while keeping analysis, findings, and OCR claims visibly guarded.

### Sections rendered

- Core (always)
- UI/UX
- Client State
- File/Media

### Dimensions suppressed (Layer 2 filter)

- Client State.Cross-tab sync — single-tab prototype flow remains acceptable.
- Client State.Offline support — offline uploads are out of scope.
- Client State.Optimistic updates — wait for server response before showing stored documents.
- File/Media.CDN — no public file delivery.
- File/Media.Image pipeline — no previews beyond metadata/text.
- UI/UX.Streaming — status display is enough until long-running OCR/agent calls exist.
- Core.Abstractions — keep upload state local until document lists become shared across screens.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 4, M x 5
- Load-bearing items skipped:
  - UI/UX.Streaming: acceptable because this phase does not run long AI work; revisit when OCR/agents exceed five seconds.

### Review trigger

- Escalate when extraction becomes long-running, when uploads need retry/resume, or when document state is reused by history/settings/export screens.

### Status

- accepted

## D8 — Phase 1 tier: mvp (2026-05-15)

**Phase:** Fact contract and schema
**Types:** persistence, data-migration, data-validation
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; the first fact contract should lock provenance and confirmation fields without introducing the full agent or findings system.

### Sections rendered

- Core (always)
- Data

### Dimensions suppressed (Layer 2 filter)

- Data.Indexing — fact lookup can start with case/document queries before search or analytics exists.
- Data.Backup/restore — production backup policy remains a release guardrail.
- Data.Partitioning — single-project MVP volume does not need partitioning.
- Core.Observability — schema-level tests are enough before long-running extraction or analysis jobs.
- Core.Abstractions — keep fact types explicit before introducing generic claim engines.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 3, M x 3
- Load-bearing items skipped:
  - Data.Indexing: revisit when fact review needs search, filtering across many documents, or analytics.

### Review trigger

- Escalate before facts drive user-visible findings, before supporting multiple document types, or before production users upload sensitive documents.

### Status

- accepted

## D9 — Phase 2 tier: mvp (2026-05-15)

**Phase:** MVP fact extraction service
**Types:** persistence, extraction, data-processing
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; deterministic conservative extraction is the smallest safe bridge from text segments to user-reviewable facts.

### Sections rendered

- Core (always)
- Data
- Background jobs

### Dimensions suppressed (Layer 2 filter)

- Background jobs.Scheduling — extraction can run synchronously after text extraction for this slice.
- Background jobs.Concurrency — no worker pool until OCR/LLM providers or volume require it.
- Background jobs.Dead-letter — failed or ambiguous extraction can be stored as warnings for manual review.
- Data.Indexing — case/document lookups are enough for first fact candidates.
- Data.Backup/restore — production backup policy remains a release guardrail.
- Core.Abstractions — do not add provider registries until LLM/OCR extraction exists.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- XL x 1, L x 4, M x 3
- Load-bearing items skipped:
  - Background jobs.Idempotency/dead-letter: acceptable only while extraction is local, deterministic, and rerunnable from stored text segments.

### Review trigger

- Escalate before adding OCR, LLM extraction, retries, worker queues, or any automatic claim promotion into findings.

### Status

- accepted

## D10 — Phase 3 tier: mvp (2026-05-15)

**Phase:** Confirmation API and analysis gate
**Types:** api, user-facing, data-validation
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; owner-scoped confirmation endpoints and a readiness gate are enough before building the analysis engine.

### Sections rendered

- Core (always)
- Data
- UI/UX

### Dimensions suppressed (Layer 2 filter)

- UI/UX.Streaming — fact confirmation is interactive and synchronous for MVP.
- UI/UX.Personalization — display rules stay tied to case stage and fact status only.
- Data.Indexing — direct case/document/fact queries are enough.
- Data.Backup/restore — production backup policy remains a release guardrail.
- Core.Abstractions — no generic workflow engine until multiple gates exist.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 3, M x 4
- Load-bearing items skipped:
  - UI/UX.Streaming: revisit when confirmation depends on long-running OCR/LLM jobs or progress events.

### Review trigger

- Escalate before confirmed facts drive `ConsumerCreditAgent`, deterministic findings, or exportable evidence.

### Status

- accepted

## D11 — Phase 4 tier: mvp (2026-05-15)

**Phase:** Frontend fact review handoff
**Types:** user-facing, client-state
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; a focused fact review screen can prove the trust boundary without redesigning the full analysis experience.

### Sections rendered

- Core (always)
- UI/UX
- Client State

### Dimensions suppressed (Layer 2 filter)

- Client State.Cross-tab sync — single-tab confirmation is enough for MVP.
- Client State.Offline support — offline confirmation is out of scope.
- Client State.Optimistic updates — wait for server confirmation before treating facts as confirmed.
- UI/UX.Streaming — confirmation work is synchronous in this plan.
- UI/UX.Empty-state personalization — one consumer-credit path only.
- Core.Abstractions — avoid shared workflow chrome until analysis and export screens become real.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 3, M x 5
- Load-bearing items skipped:
  - Client State.Optimistic updates: acceptable because confirmation correctness matters more than perceived speed.

### Review trigger

- Escalate when fact review state is reused by findings, exports, history, or multi-device sessions.

### Status

- accepted

## D12 — Phase 1 tier: mvp (2026-05-18)

**Phase:** Analysis contract and persistence
**Types:** persistence, data-migration, data-validation
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; lock the analysis and evidence contract before adding agent behavior or user-facing findings.

### Sections rendered

- Core (always)
- Data

### Dimensions suppressed (Layer 2 filter)

- Data.Backup/restore — production backup and retention policy remain Roadmap Phase 7 guardrails while this phase defines local MVP persistence.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- XL x 1, L x 2, M x 3
- Load-bearing items skipped:
  - Data.Backup/restore: acceptable only while this remains local MVP data and production document intake is still guarded.

### Review trigger

- Escalate before accepting production documents, before exporting findings, or before analysis data becomes multi-user or compliance-relevant.

### Status

- accepted

## D13 — Phase 2 tier: mvp (2026-05-18)

**Phase:** Deterministic discrepancy calculations
**Types:** data-processing, data-validation
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; deterministic calculations should be small, test-heavy, and grounded in confirmed facts before more advanced rule engines exist.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- none

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 2, M x 1, S x 1
- Load-bearing items skipped:
  - Core.Testing beyond known examples: start with golden deterministic fixtures, then expand before adding new discrepancy classes.

### Review trigger

- Escalate before adding stochastic calculations, official-rule interpretation, or more than one consumer-credit discrepancy family.

### Status

- accepted

## D14 — Phase 3 tier: mvp (2026-05-18)

**Phase:** Official reference catalog
**Types:** persistence, external-api, data-validation
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; a bounded seeded catalog is enough to preserve source metadata and marketplace-safe labels before live reference retrieval exists.

### Sections rendered

- Core (always)
- Data
- Integration

### Dimensions suppressed (Layer 2 filter)

- Integration.Retry/backoff — no live runtime fetching in this phase.
- Integration.Idempotency — reference seeds are local data writes, not mutating external calls.
- Integration.Rate-limit — no provider API calls in this MVP catalog slice.
- Data.Backup/restore — production backup policy remains a Roadmap Phase 7 guardrail.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- XL x 2, L x 3, M x 4
- Load-bearing items skipped:
  - Integration.Retry/backoff and Rate-limit: acceptable only because references start as bounded local catalog data.

### Review trigger

- Escalate before adding live CMF/SERNAC/Ley Chile fetches, automated refresh jobs, or user-visible benchmark claims without verification dates.

### Status

- accepted

## D15 — Phase 4 tier: ent (2026-05-18)

**Phase:** Structured agent orchestration
**Types:** ai-agent, llm, async-worker, data-processing
**Tier chosen:** ent
**Prototype:** no
**Reason:** Structured LLM output is consumed by code and user-visible findings, so U4 requires framework-level schema enforcement and U8 requires run measurement.

### Sections rendered

- Core (always)
- AI/Agent
- Background jobs

### Dimensions suppressed (Layer 2 filter)

- Background jobs.Scheduling — analysis runs start on user request only.
- Background jobs.Concurrency — fixed local execution is enough until real worker capacity exists.
- AI/Agent.Fallback chain — a single enforced-output path plus explicit failure state is enough before multi-model routing.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- M x 6, S x 1
- Load-bearing items skipped:
  - AI/Agent.Fallback chain: multi-model fallback is deferred, but structured output enforcement and run metrics are not.

### Review trigger

- Escalate before adding multiple LLM providers, retries across providers, production traffic, or generated exports/drafts.

### Status

- accepted

## D16 — Phase 5 tier: mvp (2026-05-18)

**Phase:** Analysis API and source inspection UI
**Types:** api, user-facing, client-state
**Tier chosen:** mvp
**Prototype:** no
**Reason:** Default MVP pick per U2; source inspection should be real and evidence-backed, while broader workflow polish stays outside this roadmap slice.

### Sections rendered

- Core (always)
- UI/UX
- Client State

### Dimensions suppressed (Layer 2 filter)

- UI/UX.Streaming — this phase can show persisted analysis status before richer SSE/token streaming exists.
- UI/UX.Personalization — one consumer-credit v0 path; before/after signing-specific polish belongs to Roadmap Phases 5 and 6.
- Client State.Cross-tab sync — single-tab source inspection is enough.
- Client State.Offline support — offline analysis is out of scope.
- Client State.Optimistic updates — wait for server-confirmed analysis state.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Delta cell overrides

- none

### Delta deferred by tier choice

- L x 5, M x 5
- Load-bearing items skipped:
  - UI/UX.Streaming: acceptable only while persisted run status prevents dead air; revisit before long live agent streams.

### Review trigger

- Escalate before adding live token streaming, keyboard-heavy evidence review, export/draft flows, or multi-tab/shared review.

### Status

- accepted

## D17 — Phase 2 tier: ent (2026-05-18)

**Phase:** Receptionist schema, persistence, and provider contract
**Types:** persistence, data-migration, ai-agent, data-validation
**Tier chosen:** ent
**Prototype:** no
**Reason:** Receptionist output crosses a trust boundary before analysis
readiness, so the contract needs stable schemas, persisted audit state, and
fail-closed provider behavior.

### Sections rendered

- Core (always)
- Data
- AI/Agent

### Dimensions suppressed (Layer 2 filter)

- AI/Agent.Fallback chain — v1 uses one provider adapter and explicit failed
  run state before multi-provider routing.
- AI/Agent.Autonomous tools — the receptionist does not investigate; it only
  reviews the provided document media.
- Data.Backup/restore — production document retention remains Roadmap Phase 7.

### Status

- accepted

## D18 — Phase 3 tier: ent (2026-05-18)

**Phase:** Multimodal media packing and run pipeline
**Types:** data-processing, ai-agent, file-io
**Tier chosen:** ent
**Prototype:** no
**Reason:** Raw document access is allowed only inside a narrow receptionist
gate, so media must be bounded before it reaches any provider.

### Sections rendered

- Core (always)
- AI/Agent
- Data

### Dimensions suppressed (Layer 2 filter)

- Background jobs.Scheduling — runs are user-triggered and synchronous for MVP.
- Background jobs.Concurrency — queueing can wait until run duration or volume
  justifies it.
- Integration.Retry/backoff — provider retry policy is deferred; failures block
  readiness instead of being hidden.

### Status

- accepted

## D19 — Phase 4 tier: ent (2026-05-18)

**Phase:** Gap comparator, resolution, promotion, and composite readiness
**Types:** api, data-validation, data-processing
**Tier chosen:** ent
**Prototype:** no
**Reason:** Human resolution can promote or correct trusted facts, so comparison
rules, blocker classification, and mutation paths must be deterministic.

### Sections rendered

- Core (always)
- Data
- API

### Dimensions suppressed (Layer 2 filter)

- API.Idempotency keys — repeated resolution requests are rejected once a gap is
  resolved; stronger idempotency can come with real auth/session tokens.
- Audit external export — local persisted audit records are enough for v1.

### Status

- accepted

## D20 — Phase 5 tier: mvp (2026-05-18)

**Phase:** Frontend gap review handoff
**Types:** user-facing, client-state, api
**Tier chosen:** mvp
**Prototype:** no
**Reason:** The UI must expose blocking gaps and resolution actions, but richer
review ergonomics can wait until the backend contract is stable under use.

### Sections rendered

- Core (always)
- UI/UX
- Client State

### Dimensions suppressed (Layer 2 filter)

- UI/UX.Keyboard review workflow — useful later, not required for MVP
  correctness.
- Client State.Optimistic updates — wait for server-confirmed gap resolution.
- Client State.Cross-tab sync — single-tab review is acceptable before real
  multi-user auth.
- UI/UX.Streaming — synchronous run status is enough for local fake/provider
  unavailable paths.

### Status

- accepted

## D21 — Phase 1 tier: ent (2026-05-26)

**Phase:** Path-aware routing and before-signing schemas
**Types:** [data-validation, api]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — path routing is the
foundation for all downstream before-signing logic; enterprise-grade error
handling and testing prevents cascading failures in later phases.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core always renders all 4 dimensions unfiltered.

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions deferred)
- Load-bearing items skipped: none (Enterprise covers edge-case testing and
  structured error handling)

### Review trigger (when to escalate this phase)

- When a third analysis path type is added beyond before/after signing.

### Status

- accepted

## D22 — Phase 2 tier: ent (2026-05-26)

**Phase:** Before-signing deterministic analysis
**Types:** [data-processing, data-validation]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — deterministic checks
must handle partial facts, zero values, missing references, and edge-case
numeric comparisons reliably to avoid misleading users.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core always renders all 4 dimensions unfiltered.

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions deferred)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When reference catalog grows beyond 10 entries or when external data sources
  are introduced.

### Status

- accepted

## D23 — Phase 3 tier: ent (2026-05-26)

**Phase:** Before-signing agent orchestration
**Types:** [ai-agent, data-processing]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — U4 structured output
red-line requires framework-level enforcement when downstream code consumes
findings mechanically; enterprise tier is the minimum for AI/Agent section
compliance.

### Sections rendered

- Core (always)
- AI/Agent: Prompt eval, Structured output (2 of 4 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- AI/Agent.Cost/latency budget — single-provider local dev; no multi-model
  routing or budget caps needed at this maturity.
- AI/Agent.Fallback chain — one provider path; fallback to deterministic-only
  is the implicit safe default.

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions from Core)
- M × 1 (Scale prompt eval — adversarial prompt testing deferred)
- Load-bearing items skipped: none (Enterprise structured output satisfies U4)

### Review trigger (when to escalate this phase)

- When a second LLM provider is added or when agent latency exceeds 10s p95.

### Status

- accepted

## D24 — Phase 4 tier: ent (2026-05-26)

**Phase:** Before-signing UI and finding presentation
**Types:** [user-facing, client-state, api]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — user-facing findings
must handle error states, loading states, and empty states gracefully to
maintain trust in before-signing guidance.

### Sections rendered

- Core (always)
- UI/UX: Loading states, Error states (2 of 4 dims rendered)
- Client State: Cache invalidation, Store coupling (2 of 7 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- UI/UX.A11y — important but not load-bearing for MVP/ent correctness; revisit
  at Scale or when accessibility audit is scheduled.
- UI/UX.Streaming — before-signing analysis is request/response, not streamed.
- Client State.Optimistic updates — analysis runs are server-authoritative;
  optimistic UI adds complexity without user benefit here.
- Client State.Stale data — single-tab, single-case workflow; stale data risk
  is low.
- Client State.Mutation propagation — no cross-component mutation chains in
  before-signing path.
- Client State.Cross-tab sync — single-tab review is acceptable.
- Client State.Offline support — online-only is acceptable at this maturity.

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions from Core)
- M × 2 (Scale loading states polish, Scale error state recovery)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When mobile-web support is added or when user research reveals error-state
  confusion.

### Status

- accepted

## D25 — Phase 1 tier: ent (2026-05-27)

**Phase:** After-signing deterministic analysis service
**Types:** [data-processing, data-validation]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — deterministic
discrepancy enrichment, missing comparison context detection, and escalation
questions must handle partial facts and edge-case numeric comparisons reliably.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core always renders all 4 dimensions unfiltered.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions deferred)
- Load-bearing items skipped: none (Enterprise covers edge-case testing and
  structured error handling)

### Review trigger (when to escalate this phase)

- When cross-document comparison requires real extraction from comparison
  documents or when discrepancy classes exceed 5.

### Status

- accepted

## D26 — Phase 2 tier: ent (2026-05-27)

**Phase:** After-signing agent enrichment
**Types:** [ai-agent, data-processing]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — U4 structured output
red-line requires framework-level enforcement when downstream code consumes
findings mechanically; enterprise tier is the minimum for AI/Agent section
compliance.

### Sections rendered

- Core (always)
- AI/Agent: Structured output (1 of 4 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- AI/Agent.Prompt eval — FakeProvider, no real LLM prompts to evaluate.
- AI/Agent.Cost/latency budget — zero-cost FakeProvider; no multi-model
  routing or budget caps needed.
- AI/Agent.Fallback chain — single provider path; deterministic-only is the
  implicit safe default.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions from Core)
- M × 1 (Scale structured output — fallback chain deferred)
- Load-bearing items skipped: none (Enterprise structured output satisfies U4)

### Review trigger (when to escalate this phase)

- When a real LLM provider is wired for after-signing analysis or when agent
  latency exceeds 10s p95.

### Status

- accepted

## D27 — Phase 3 tier: ent (2026-05-27)

**Phase:** After-signing UI presentation and docs
**Types:** [user-facing, client-state, web]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Cover enterprise edge cases on all phases — user-facing findings
must handle error states, loading states, and empty states gracefully to
maintain trust in after-signing discrepancy evidence.

### Sections rendered

- Core (always)
- UI/UX: Loading states, Error states (2 of 4 dims rendered)
- Client State: Cache invalidation, Store coupling (2 of 7 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- UI/UX.A11y — important but not load-bearing for MVP/ent correctness; revisit
  at Scale or when accessibility audit is scheduled.
- UI/UX.Streaming — after-signing analysis is request/response, not streamed.
- Client State.Optimistic updates — analysis runs are server-authoritative;
  optimistic UI adds complexity without user benefit here.
- Client State.Stale data — single-tab, single-case workflow; stale data risk
  is low.
- Client State.Mutation propagation — no cross-component mutation chains in
  after-signing path.
- Client State.Cross-tab sync — single-tab review is acceptable.
- Client State.Offline support — online-only is acceptable at this maturity.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing + Scale abstractions from Core)
- M × 2 (Scale loading states polish, Scale error state recovery)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When mobile-web support is added or when user research reveals
  discrepancy-state confusion.

### Status

- accepted

## D28 — Phase 1 tier: ent (2026-05-27)

**Phase:** Run audit timeline and observability
**Types:** [data-processing, data-validation]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Audit timelines are the backbone of REQ-13 — enterprise error handling and structured observability ensure run state, cost, latency, and warnings are reliably captured from day one.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core-only phase, all 4 dimensions rendered.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing fuzz/load, Scale abstractions plugin layer)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When audit data is consumed by external compliance tooling or when run volume exceeds 100/day.

### Status

- accepted

## D29 — Phase 2 tier: ent (2026-05-27)

**Phase:** Document retention and access guardrails
**Types:** [data-processing, data-validation]
**Tier chosen:** ent
**Prototype:** no
**Reason:** REQ-13 mandates defined retention, deletion, and access-control behavior for every production path handling user documents. Enterprise error handling and testing ensure guardrails actually enforce.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core-only phase, all 4 dimensions rendered.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing fuzz/load, Scale abstractions plugin layer)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When multi-user access control is introduced or when legal/compliance requires retention audit export.

### Status

- accepted

## D30 — Phase 3 tier: ent (2026-05-27)

**Phase:** Finding selection and export service
**Types:** [data-processing]
**Tier chosen:** ent
**Prototype:** no
**Reason:** REQ-12 requires exports to refuse unsupported outputs and include source references for every claim. Enterprise error handling ensures malformed selections fail clearly rather than producing incomplete exports.

### Sections rendered

- Core (always)

### Dimensions suppressed (Layer 2 filter)

- None — Core-only phase, all 4 dimensions rendered.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing fuzz/load, Scale abstractions plugin layer)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When export format diversifies beyond summary text or when downstream consumers parse exports programmatically.

### Status

- accepted

## D31 — Phase 4 tier: ent (2026-05-27)

**Phase:** Communication draft generation
**Types:** [ai-agent, data-processing]
**Tier chosen:** ent
**Prototype:** no
**Reason:** Draft generation touches the advice boundary (B4/SR-01). Enterprise structured output and cost/latency budget ensure drafts are machine-parseable and bounded, preventing uncontrolled LLM spend or advice-crossing outputs.

### Sections rendered

- Core (always)
- AI/Agent: Structured output, Cost/latency budget (2 of 4 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- AI/Agent.Prompt eval — single-purpose draft generator with fixed template; prompt drift risk is low.
- AI/Agent.Fallback chain — draft failure shows error to user; no multi-provider fallback needed.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing fuzz/load, Scale abstractions plugin layer)
- M × 1 (Scale AI/Agent cost/latency budget alerting)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When draft generation is used in production with real users or when a second draft template type is added.

### Status

- accepted

## D32 — Phase 5 tier: ent (2026-05-27)

**Phase:** Export and draft UI
**Types:** [user-facing, client-state, web]
**Tier chosen:** ent
**Prototype:** no
**Reason:** User-facing export and draft screens must handle loading, error, and empty states gracefully. Enterprise UI ensures the export flow communicates clearly when selections are invalid or drafts fail to generate.

### Sections rendered

- Core (always)
- UI/UX: Loading states, Error states (2 of 4 dims rendered)
- Client State: Store coupling (1 of 7 dims rendered)

### Dimensions suppressed (Layer 2 filter)

- UI/UX.A11y — mockup-grade screens at MVP maturity; revisit at Scale or accessibility audit.
- UI/UX.Streaming — export and draft are one-shot request/response, not streamed.
- Client State.Cache invalidation — export is a one-shot read flow; no cache to invalidate.
- Client State.Optimistic updates — export/draft are server-authoritative; no optimistic UI needed.
- Client State.Stale data — single-tab, single-case workflow; stale data risk is low.
- Client State.Mutation propagation — no cross-component mutation chains in export path.
- Client State.Cross-tab sync — single-tab review is acceptable.
- Client State.Offline support — online-only is acceptable at this maturity.

### Per-dim tier overrides

```yaml
dim_overrides: []
```

### Δ deferred by tier choice

- L × 2 (Scale testing fuzz/load, Scale abstractions plugin layer)
- M × 2 (Scale loading states polish, Scale error state recovery)
- Load-bearing items skipped: none

### Review trigger (when to escalate this phase)

- When mobile-web export is required or when user research reveals export-flow confusion.

### Status

- accepted
