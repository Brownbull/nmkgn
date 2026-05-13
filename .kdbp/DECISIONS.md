# Architecture Decisions

| # | Date | Decision | Rationale | Alternatives Considered | Status | Review Trigger |
|---|------|----------|-----------|------------------------|--------|----------------|
| D1 | 2026-05-12 | V0 targets Chilean consumer-credit review with document-specific Pydantic agents | The loan scenario gives a concrete, high-value first slice and avoids unsafe generic legal-analysis claims | Broad legal-document analyzer; prompt-defined variable schemas; UI-only mockup continuation | active | First non-credit document type, backend schema design, or legal-advice boundary change |
| D2 | 2026-05-13 | Phase 1 tier is MVP with stub login, FastAPI under `api/`, PostgreSQL, and Alembic | Build the spine before the scanner: prove persisted case creation without auth, OCR, agents, or document storage | Enterprise auth-first setup; frontend-only local storage; backend under `backend/`; no migrations | active | Auth scope, DB migration strategy, or package layout change |
| D3 | 2026-05-13 | Local nmkgn development uses registered non-default ports | Parallel projects on this workstation may use common defaults; reserving project-specific ports reduces collisions | Default Vite `5173`, API `8000`, PostgreSQL `5432`; ad hoc per-session overrides | active | Any local service port change or new local endpoint |

<!-- Status: active / superseded / revisit -->
