# Documentation Tracking

Maps source patterns to documentation targets. Used by Gabe doc-drift checks.

## Agent App

| Source Pattern | Doc Target | Section | Priority |
|---|---|---|---|
| `api/models/*.py` | `docs/architecture.md` | Data Model | critical |
| `api/schemas/*.py` | `docs/architecture.md` | API Contracts | critical |
| `api/routes/*.py` | `docs/architecture.md` | API Endpoints | high |
| `api/services/*.py` | `docs/architecture.md` | Services | medium |
| `api/agents/*.py` | `docs/AGENTS_USE.md` | Agent Design | critical |
| `api/guardrails/*.py` | `docs/AGENTS_USE.md` | Safety | high |
| `api/observability/*.py` | `docs/SCALING.md` | Observability | medium |
| `src/screens/**` | `docs/V0_ALIGNMENT.md` | UX Structure From Current Mockups | medium |
| `src/components/**` | `docs/architecture.md` | Frontend Structure | medium |
| `docs/V0_ALIGNMENT.md` | `docs/architecture.md` | System Boundary | high |
| `tests/**` | skip |  |  |
| `.kdbp/**` | skip |  |  |
