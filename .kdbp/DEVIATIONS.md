# Deviations Log

| Date | Phase | Task | Type | Note |
|------|-------|------|------|------|
| 2026-05-29 | 7 | T1-T3 | scope-variance | consumer_credit_provider.py not modified — draft service is standalone, consuming ExportSummary from Phase 6 instead of coupling to the provider |
| 2026-05-29 | 8 | T1 | scope-creep | Added api/routes/export.py and api/main.py modification — API routes needed for UI to function (backend services existed but had no HTTP layer) |
| 2026-05-29 | 8 | T1 | scope-creep | Added src/api/export.ts — frontend API client for export/draft endpoints |
