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
