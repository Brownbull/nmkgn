# Phase 2 Review — Before-signing deterministic analysis

**Date:** 2026-05-27
**Scope:** api/services/before_signing.py, api/services/analysis.py, tests/api/test_before_signing.py, tests/api/test_analysis_api.py, tests/api/conftest.py, docs/architecture.md
**Verdict:** APPROVE
**Confidence:** 96 → 100/100 (post-triage)

## Findings

| # | Sev | Finding | File | Churn | Fix Cost | Defer Risk | Gate | Action |
|---|-----|---------|------|-------|----------|------------|------|--------|
| 1 | LOW | N+1 reference queries in `generate_missing_info_findings` — `_load_references_by_keys` called inside loop (up to 4 queries) | before_signing.py:198 | STABLE | S | DB round-trip overhead — P(low), Impact(low) | Scale | FIXED |
| 2 | LOW | Duplicated `_engine`/`session` fixture across test_analysis_api.py and test_before_signing.py | tests/api/ | STABLE | S | Drift risk if fixture logic diverges — P(medium), Impact(low) | Scale | FIXED |

## Triage

All findings resolved in-session:
- **#1:** Batched `_load_references_by_keys` call outside loop; single query + dict lookups.
- **#2:** Extracted shared `session` fixture to `tests/api/conftest.py`; removed local `_engine`/`session`/imports from both test files.

## Coverage

HIGH — 34 tests cover: after-signing discrepancy golden path + no-discrepancy + not-ready + case-not-found + run-not-found + invalid-plan; before-signing golden path + bs_ prefix + data-presence trigger + readiness snapshot + evidence; missing-info findings for 4 optional facts; negotiation questions with reference citations; attach_reference_evidence mapping; edge cases (zero values, missing references, partial facts).

## Alignment

ALIGNED — all changed files are on-scope per Phase 2 plan (before_signing.py, analysis.py, test files, architecture docs).

## Tier

ent | DRIFT: none
