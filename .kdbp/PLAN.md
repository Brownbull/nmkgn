# Active Plan

<!-- status: active -->
<!-- project_type: code -->
<!-- goal: Real document upload persistence and text extraction -->
<!-- created: 2026-05-14 -->
<!-- last_updated: 2026-05-14T21:35 -->

## Goal

Persist real consumer-credit case documents and extract reviewable text with
source metadata before any agent or finding path consumes the upload.

## Context

- **Maturity:** mvp
- **Domain:** Chilean consumer-credit case reviewer.
- **Created:** 2026-05-14
- **Last Updated:** 2026-05-14
- **Roadmap coverage:** ROADMAP Phase 2 (`REQ-02`, `REQ-04`) plus the text
  extraction foundation for Phase 3 (`REQ-03`), without normalized fact
  extraction or confirmation controls yet.
- **Related pending items:** PENDING #1 (provenance-ready persistence) and
  PENDING #2 (runtime config consolidation).

## Scope

### In

- Document records tied to persisted cases and scoped to the stub owner.
- Primary and comparison document roles for the current consumer-credit flow.
- Local file persistence behind configurable storage settings.
- Upload API accepting bounded file types and sizes.
- Document status, extraction status, checksum, byte size, content type, and
  storage path metadata.
- Text extraction for text-bearing PDFs and plain text files.
- Persisted extracted text segments with source document id, page number or text
  span, extraction provider label, extraction date, and confidence when known.
- Frontend upload screen wired to real document upload/status while preserving
  prototype boundaries for analysis, findings, and unsupported document types.
- Architecture and agent docs updated to reflect the new ingestion boundary.

### Out

- OCR provider integration for scanned PDFs or images.
- Normalized consumer-credit fact extraction, high-impact fact confirmation, or
  user corrections.
- ConsumerCreditAgent execution, findings, deterministic discrepancy checks, or
  generated drafts.
- Real authentication, multi-user authorization, public document serving,
  antivirus scanning, object storage, CDN delivery, and production retention
  automation.
- Broad legal-document upload or generic "analyze anything" behavior.

## Phases

| # | Phase | Description | Types | Tier | Complexity | Exec | Review | Commit | Push |
|---|-------|-------------|-------|------|------------|------|--------|--------|------|
| 1 | Storage contract and schema | Add upload configuration, document/extraction schema, Alembic migration, and architecture docs for provenance-ready storage. | `persistence, data-migration, upload, storage` | mvp (Retention→ent) | med | ✅ | ✅ | ✅ | ✅ |
| 2 | Backend ingestion API | Implement scoped multipart upload, document listing/read endpoints, local file write path, status transitions, and backend tests. | `upload, storage, user-facing, persistence` | mvp | high | ✅ | ✅ | ⬜ | ⬜ |
| 3 | Text extraction pipeline | Extract text from supported text-bearing uploads, persist page/span segments, record warnings/failures, and keep scanned-image OCR clearly pending. | `persistence, async-worker, data-migration` | mvp | high | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | Frontend upload/status handoff | Replace the prototype-only upload action with real file selection, upload progress/status, extracted-text preview, and analysis guardrails. | `user-facing, client-state, upload` | mvp | med | ⬜ | ⬜ | ⬜ | ⬜ |

<!-- Exec is written by /gabe-execute: ⬜ not started, 🔄 in progress, ✅ complete -->
<!-- Review/Commit/Push auto-ticked by /gabe-review, /gabe-commit, /gabe-push -->
<!-- A phase is complete when all four status columns are ✅ -->
<!-- /gabe-next routes to the next command based on column state -->
<!-- Tier column values: mvp | ent | scale, with compact per-dim overrides when needed. -->

## Phase Details

### Phase 1 — Storage contract and schema

```yaml
phase: 1
types: [persistence, data-migration, upload, storage]
phase_tier: mvp
prototype: false
dim_overrides:
  - section: File/Media
    dim: Retention
    tier: ent
    reason: Real document records need retention metadata and a production guard before storage ships.
sections_considered: [Core, Data, File/Media]
suppressed_dims_count: 5
decisions_entry: D4
```

- **Tier chosen:** `mvp` with File/Media Retention override to `ent`.
- **Prototype:** no.
- **Likely files:** `api/config.py`, `api/models/document.py`,
  `api/models/extraction.py`, `api/migrations/versions/*`,
  `api/schemas/documents.py`, `.env.example`, `docs/architecture.md`.
- **Acceptance:** migrations create document and extracted-text storage; storage
  settings are centralized; records can represent primary/comparison uploads,
  extraction status, retention state, and provenance-ready metadata.
- **Trade-offs accepted:** See `DECISIONS.md` D4.

### Phase 2 — Backend ingestion API

```yaml
phase: 2
types: [upload, storage, user-facing, persistence]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, File/Media, UI/UX, Data]
suppressed_dims_count: 6
decisions_entry: D5
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/routes/documents.py`, `api/services/documents.py`,
  `api/schemas/documents.py`, `api/models/document.py`, `api/main.py`,
  `tests/api/test_documents.py`.
- **Acceptance:** a persisted case can accept a primary or comparison upload;
  the API rejects unsupported owner/case/type/size combinations; metadata and
  file bytes persist; list/read endpoints only return the stub owner's
  documents.
- **Trade-offs accepted:** See `DECISIONS.md` D5.

### Phase 3 — Text extraction pipeline

```yaml
phase: 3
types: [persistence, async-worker, data-migration]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, Data, Background jobs]
suppressed_dims_count: 5
decisions_entry: D6
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `api/services/text_extraction.py`,
  `api/models/extraction.py`, `api/schemas/documents.py`,
  `api/routes/documents.py`, `tests/api/fixtures/*`,
  `tests/api/test_text_extraction.py`.
- **Acceptance:** supported uploads move through extracted/failed/needs-ocr
  states; extracted text segments are persisted with document id, page or span,
  provider label, extraction timestamp, and warnings; scanned image/OCR cases
  are visible as pending rather than silently treated as read.
- **Trade-offs accepted:** See `DECISIONS.md` D6.

### Phase 4 — Frontend upload/status handoff

```yaml
phase: 4
types: [user-facing, client-state, upload]
phase_tier: mvp
prototype: false
dim_overrides: []
sections_considered: [Core, UI/UX, Client State, File/Media]
suppressed_dims_count: 7
decisions_entry: D7
```

- **Tier chosen:** `mvp`.
- **Prototype:** no.
- **Likely files:** `src/api/documents.ts`, `src/screens/Upload.tsx`,
  `src/components/NavContext.tsx`, `tests/frontend/Upload.test.tsx`.
- **Acceptance:** users upload files from the persisted case upload screen, see
  stored document metadata and extraction status, can inspect a small extracted
  text preview, and cannot proceed into prototype analysis as if findings were
  real.
- **Trade-offs accepted:** See `DECISIONS.md` D7.

## Current Phase

Phase 2: Backend ingestion API

## Dependencies

- Phase 2 depends on Phase 1 schema/config.
- Phase 3 depends on Phase 2 stored document bytes and metadata.
- Phase 4 depends on Phase 2 API contracts and Phase 3 status fields.
- Normalized fact extraction and confirmation remain a later plan after this
  plan proves document identity and text provenance.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Sensitive documents are stored before production hardening exists. | high | Keep storage local/dev-only, do not publicly serve files, add retention metadata now, and block production acceptance until auth, backup, retention, and scan policy are defined. |
| Extracted text is mistaken for verified facts. | high | Store extracted text separately from facts; label it as extraction output; keep findings/analysis blocked until normalized facts and confirmation exist. |
| Scanned PDFs/images produce empty extraction. | medium | Persist `needs_ocr` or failed extraction status with user-visible warning; leave OCR provider integration out of this plan. |
| DB/file-system drift leaves orphaned files or records. | medium | Write backend tests for failed writes and deletion/error behavior; keep file path generation deterministic and scoped by case/document id. |
| Runtime config drifts across frontend, backend, and local scripts. | medium | Address PENDING #2 by centralizing upload/API/storage config and documenting `.env.example`. |

## Notes

- This plan intentionally advances the real ingestion boundary without making
  analysis claims. It should remove the current "No analiza PDFs reales" upload
  limitation only for storage and extraction status, not for findings.
- Do not update `.kdbp/SCOPE.md` or `.kdbp/ROADMAP.md` from this plan; those
  remain `/gabe-scope*` surfaces.
