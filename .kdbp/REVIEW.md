<!-- gabe-review-live:1.1 -->
---
sources:
  - cli: codex
    model: gpt-5
    timestamp: 2026-05-14T16:38:20-04:00
    findings: 3
consolidated_at: 2026-05-14T16:38:20-04:00
consolidation: single-source
project_root: /home/khujta/projects/apps/nmkgn
target: Phase 1 Storage contract and schema
maturity: mvp
status: resolved
---

# Gabe Review — Live Document

**Verdict:** APPROVE
**Confidence:** 92/100
**Coverage:** MEDIUM
**Findings:** 3 (CRITICAL: 0, HIGH: 0, MEDIUM: 2, LOW: 1) | **Sources:** codex
**Resolution:** 3 fixed / 0 deferred / 0 dismissed of 3 (pending: 0)

## Findings

| # | Status | Severity | Finding | File | Churn | Fix Cost | Defer Risk | Maturity Gate | Escalation | Sources |
|---|--------|----------|---------|------|-------|----------|------------|---------------|------------|---------|
| 1 | fixed | MEDIUM | Extracted text segments could be created without a page number or complete text span, weakening the provenance contract this phase is meant to establish. Fixed: Pydantic now requires either a page number or paired start/end offsets, and the migration/model metadata enforce the same locator constraints. | api/schemas/documents.py:81 | STABLE | S | AMBIGUOUS EXTRACTION PROVENANCE — P(medium), I(high) | MVP | — | codex |
| 2 | fixed | MEDIUM | Upload storage settings accepted non-positive size/retention bounds and blank storage/content-type settings from env, which could silently disable or misconfigure the upload boundary before Phase 2 uses it. Fixed: env parsing now rejects non-positive limits and blank storage/content-type settings. | api/config.py:50 | STABLE | S | RUNTIME UPLOAD MISCONFIGURATION — P(medium), I(moderate) | MVP | — | codex |
| 3 | fixed | LOW | `checksum_sha256` only checked string length, so non-hex digests could enter the document contract. Fixed: document schema normalizes and validates 64-character SHA-256 hex digests. | api/schemas/documents.py:33 | STABLE | S | BAD CHECKSUM METADATA — P(low), I(moderate) | MVP | — | codex |

## Plan Alignment

Alignment: ALIGNED. The reviewed implementation maps to Phase 1: upload storage
configuration, document/extracted-text schema, Alembic migration, contract tests,
and architecture/agent docs. The plan/decision document churn reflects the new
four-phase ingestion plan and does not introduce off-scope product behavior.

## Stale Verified Topics

None.

## Architectural Decisions

None proposed beyond the accepted D4-D7 phase tier decisions already recorded in
`.kdbp/DECISIONS.md`.

## Tier Drift

None detected for MVP Phase 1. The File/Media Retention enterprise override is
represented by retention fields and the production-upload guard.

## Deferred Backlog Status

- PENDING #1 is partially addressed by provenance-ready schema, but remains
  deferred until upload persistence and extraction wiring complete.
- PENDING #2 is partially addressed by `.env.example` and upload config
  consolidation, but remains deferred until frontend/API runtime config is
  fully centralized.

## Verification

- `uv run pytest tests/api/test_documents_contract.py tests/api/test_cases.py -q`
  — passed, 17 tests.
- `git diff --check` — passed.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-review-alembic-$$.db uv run alembic -c api/migrations/alembic.ini upgrade head`
  — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` against the
  configured PostgreSQL URL was not rerun because `docker` is unavailable in
  this WSL distro, so `npm run db:up` could not start the local database.

---
_Review resolved. All findings fixed._
