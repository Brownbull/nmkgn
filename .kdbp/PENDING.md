# Deferred Items

| # | Date | Source | Finding | File | Scale | Priority | Impact | Times Deferred | Status |
|---|------|--------|---------|------|-------|----------|--------|----------------|--------|
| 1 | 2026-05-13 | gabe-align | Build provenance-ready persistence before extraction creates user-visible facts or findings. | `api/models`, `api/migrations` | MVP | High | Prevents unsupported analysis claims from becoming product behavior. | 0 | Resolved |
| 2 | 2026-05-13 | gabe-align | Consolidate runtime config into `.env.example` or generated client config before adding more endpoints. | `package.json`, `api/config.py`, `src/api/client.ts` | MVP | Medium | Reduces local port/API drift as backend surface grows. | 0 | Resolved |
| 3 | 2026-05-26 | gabe-review | `_findings_from_calculations` uses inverted double-negative logic for `term_matches_count` — fragile for future maintainers. | `api/services/consumer_credit_provider.py` | Scale | Medium | LOGIC MISREAD — P(low), I(moderate) | 0 | open |
| 4 | 2026-05-26 | gabe-review | `run_agent_analysis` and `run_deterministic_analysis` share ~40 lines of duplicated setup — risk of drift between paths. | `api/services/analysis.py` | Scale | Low | DRIFT BETWEEN PATHS — P(medium), I(low) | 2 | Resolved — extracted `prepare_analysis()` in `api/services/audit.py` (Phase 1, 2026-05-27) |
