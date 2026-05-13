# Project Structure Standard

Used by Gabe checks when new files are added.

## Maturity

**Current:** mvp

## Allowed Patterns

| Pattern | Description | Tier |
|---------|-------------|------|
| `.kdbp/**` | KDBP state | MVP |
| `CLAUDE.md` | Project KDBP entrypoint | MVP |
| `README.md` | Project readme | MVP |
| `LICENSE*` | License file | MVP |
| `.gitignore` | Git ignore | MVP |
| `docs/**/*.md` | Project documentation | MVP |
| `src/**/*.{ts,tsx,js,jsx,css}` | Current React/Vite application source | MVP |
| `public/**` | Static assets | MVP |
| `index.html` | Vite entry HTML | MVP |
| `package.json` | Frontend dependencies and scripts | MVP |
| `package-lock.json` | npm lockfile | MVP |
| `vite.config.ts` | Vite config | MVP |
| `eslint.config.js` | ESLint config | MVP |
| `tsconfig*.json` | TypeScript config | MVP |
| `tests/**/*.{py,ts,tsx,js,jsx}` | Test files | MVP |
| `scripts/**/*.{sh,py,ts,js}` | Utility scripts | MVP |
| `api/**/__init__.py` | Python package markers | MVP |
| `api/main.py` | Future FastAPI entry | MVP |
| `api/config.py` | Future backend settings | MVP |
| `api/routes/*.py` | Future HTTP handlers | MVP |
| `api/schemas/*.py` | Future Pydantic request/response schemas | MVP |
| `api/agents/*.py` | Future document-specific Pydantic agents | MVP |
| `api/services/*.py` | Future business logic | MVP |
| `api/guardrails/*.py` | Future safety and validation | MVP |
| `api/models/*.py` | Future persistence models | MVP |
| `api/migrations/**` | Alembic migration environment and versions | MVP |
| `api/observability/*.py` | Future metrics/tracing | Enterprise |
| `pyproject.toml` | Future Python dependencies | MVP |
| `uv.lock` | Future Python lockfile | MVP |
| `docker/**` | Future local service configuration | MVP |
| `infra/**` | Future deployment configuration | Enterprise |

## Disallowed Patterns

| Pattern | Reason |
|---------|--------|
| `**/.env` | Secrets - use `.env.example` for templates |
| `**/node_modules/**` | Never commit dependencies |
| `dist/**` | Build output |
| `**/__pycache__/**` | Build artifacts |
| `**/*.pyc` | Compiled bytecode |

## Exceptions Log

| Date | File | Reason |
|------|------|--------|
