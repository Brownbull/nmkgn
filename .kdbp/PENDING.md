# Deferred Items

| # | Date | Source | Finding | File | Scale | Priority | Impact | Times Deferred | Status |
|---|------|--------|---------|------|-------|----------|--------|----------------|--------|
| 1 | 2026-05-13 | gabe-align | Build provenance-ready persistence before extraction creates user-visible facts or findings. | `api/models`, `api/migrations` | MVP | High | Prevents unsupported analysis claims from becoming product behavior. | 0 | Resolved |
| 2 | 2026-05-13 | gabe-align | Consolidate runtime config into `.env.example` or generated client config before adding more endpoints. | `package.json`, `api/config.py`, `src/api/client.ts` | MVP | Medium | Reduces local port/API drift as backend surface grows. | 0 | Resolved |
