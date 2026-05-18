<!-- gabe-review-live:1.1 -->
---
sources:
  - cli: codex
    model: gpt-5
    timestamp: 2026-05-18T17:04:10Z
    findings: 1
  - cli: claude
    model: claude-opus-4-6
    timestamp: 2026-05-18T13:20:00Z
    findings: 1
consolidated_at: 2026-05-18T13:20:00Z
consolidation: union
project_root: /home/khujta/projects/apps/nmkgn
target: Phase 1 - Analysis contract and persistence
maturity: mvp
status: resolved
---

# Gabe Review — Live Document

**Verdict:** APPROVE
**Confidence:** 95/100
**Coverage:** HIGH
**Findings:** 1 (CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0) | **Sources:** codex+claude
**Resolution:** 1 fixed / 0 deferred / 0 dismissed (pending: 0)

## Findings

| # | Status | Severity | Finding | File | Churn | Fix Cost | Defer Risk | Maturity Gate | Escalation | Sources |
|---|--------|----------|---------|------|-------|----------|------------|---------------|------------|---------|
| 1 | fixed | CRITICAL | Evidence anchors (`finding_id`, `fact_id`, `calculation_id`) used single-column FKs that could point at entities from a different run or case, breaking the evidence trust boundary | `api/models/analysis.py:257` | ✅ STABLE | M | MISATTRIBUTED EVIDENCE TRAIL — P(medium), I(catastrophic) | MVP | - | codex, claude |

## Fix Applied

Added composite FK targets on `AnalysisFinding`, `AnalysisCalculation`, and
`ConsumerCreditFact` (unique constraints on `(id, run, case)` or `(id, case)`)
and replaced the three single-column evidence FKs with composite FKs that scope
to the same run/case. Updated the Alembic migration to match (batch mode for
the pre-existing facts table). Added three regression tests that verify the DB
rejects cross-run finding evidence, cross-run calculation evidence, and
cross-case fact evidence.

## Verification

- `uv run pytest` — passed, 58 tests.
- `npm test` — passed, 24 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run ruff check` — passed.
- `uv run ruff format --check` — changed files formatted.

## Plan Alignment (5a)

ALIGNED — all changed files match Phase 1 scope.

## Stale Verified Topics (5c)

None.

## Architectural Decisions (5b)

None proposed.

## Tier Drift (5d)

None detected.

## Deferred Backlog Status

No open deferred items.
