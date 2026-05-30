# Session Ledger

## 2026-05-30 — PHASE EXEC COMPLETE: Phase 8 — Export and draft UI
TIER: ent
TASKS: 5 tasks, 3 commits
DEVIATIONS: 2 minor (api/routes/export.py + src/api/export.ts not in original Scope — routes needed for UI)
EVIDENCE: .kdbp/evidence/phase-8/ (4 screenshots: app load, debug panel, export screen with selection UI)
RUNTIME: Playwright Chromium against https://nmkgn-app-production.up.railway.app
E2E: 4/4 pass (export route mounted, draft route mounted, SPA navigation, export screen content)
RAILWAY: Alembic migration 0008 applied manually via `railway ssh`; deployed via `railway up`

## 2026-05-29 — [67ba428] feat(ui): replace Email mockup with real export/draft screens
FINDINGS: 2 (0 critical, 0 high after resolution, 1 medium resolved, 0 low)
ACTIONS: 1:update-docs (docs/architecture.md — API Endpoints + Frontend Structure), 2:update-docs (docs/architecture.md — Frontend)
DEFERRED: none

## 2026-05-29 — PHASE 8 EXEC BLOCKED (RESOLVED): runtime journey evidence was pending
BLOCKER: Docker not available in WSL 2 — resolved by using Railway deployment + `railway ssh` for migration
RESOLUTION: Used `railway ssh -- uv run alembic upgrade head` + `railway up` to deploy, then Playwright E2E against Railway URL

## 2026-05-29 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P22

## 2026-05-29 — PHASE 7 REVIEW: Communication draft generation
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 0 medium, 2 low)
COVERAGE: HIGH
CONFIDENCE: 96 → 100/100 (2 fixed, 0 deferred, 0 dismissed)
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅
FIXES: removed dead DraftFilterRejectionError; fixed B4 replacement priority for plural verb forms

## 2026-05-29 — [c2a6f41] feat(draft): add communication draft generation with B4 cautious language post-filter
FINDINGS: 1 (0 critical after resolution, 0 high, 1 medium resolved, 0 low)
ACTIONS: 1:update-docs (docs/architecture.md — Services section updated)
DEFERRED: none

## 2026-05-29 — PHASE EXEC COMPLETE: Phase 7 — Communication draft generation
TIER: ent
TASKS: 3 tasks, 1 commit
DEVIATIONS: 0 structural, 1 minor (consumer_credit_provider.py not modified — draft service is standalone)

## 2026-05-29 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P21

## 2026-05-29 — PHASE 6 REVIEW: Finding selection and export service
VERDICT: APPROVE
FINDINGS: 0 total (0 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH
CONFIDENCE: 100/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅

## 2026-05-29 — [6a394fe] feat(export): add finding selection and export service with evidence validation
FINDINGS: 1 (0 critical after resolution, 0 high, 0 medium, 0 low)
ACTIONS: 1:update-docs (docs/architecture.md — API Contracts + Services sections updated)
DEFERRED: none

## 2026-05-29 — PHASE EXEC COMPLETE: Phase 6 — Finding selection and export service
TIER: ent
TASKS: 3 tasks, 1 commit
DEVIATIONS: 0 structural, 1 minor (api/schemas/export.py not in original Scope — Pydantic schemas for export request/response)

## 2026-05-29 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P20

## 2026-05-29 — PHASE 5 REVIEW: Document retention and access guardrails
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 1 medium, 1 low)
COVERAGE: HIGH
CONFIDENCE: 93 → 100/100 (2 fixed, 0 deferred, 0 dismissed)
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅
FIXES: access_denied audit log now commits before exception propagation; test modernized to select() API

## 2026-05-28 — PHASE EXEC COMPLETE: Phase 5 — Document retention and access guardrails
TIER: ent
TASKS: 4 tasks, 1 commit
DEVIATIONS: 0 structural, 1 minor (migration file not in original Scope — infrastructure for DocumentAuditLog model)

## 2026-05-28 — [e24a8d5] feat(retention): enforce document retention state machine, owner-scoped access, and lifecycle audit logging
FINDINGS: 1 (0 critical after resolution, 0 high, 0 medium, 0 low)
ACTIONS: 1:update-docs (docs/architecture.md — Data Model + Services sections updated)
DEFERRED: none

## 2026-05-28 — PHASE 4 REVIEW: Fact review UX improvements
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 1 medium, 1 low)
COVERAGE: MEDIUM
CONFIDENCE: 88 → 100/100 (1 fixed, 1 dismissed — Scale-tier useMemo is correct as-is)
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅
FIXES: bulk actions now use Promise.allSettled for parallel execution + partial failure reporting

## 2026-05-28 — PLAN UPDATE: Insert Phase 4 (Fact review UX), renumber Phases 4-7 → 5-8
CHANGE: New Phase 4 inserted — Fact review UX improvements (bulk actions, stats, grouping, consistent layout)
TIER: ent (user wants edge-case coverage: loading states, inline error recovery)
DECISIONS: D35
RENUMBERED: old Phase 4→5, 5→6, 6→7, 7→8

## 2026-05-28 — PUSH: Phase 3 — E2E and integration testing infrastructure
COMMITS: 6 (aeae26b..3d5630e)
REMOTE: origin/main
PHASE STATUS: Exec ✅ | Review ✅ | Commit ✅ | Push ✅
ADVANCED: Current Phase → 4 (Document retention and access guardrails)
CI: ✅ All jobs passed (lint, 234 API tests, 6 E2E smoke tests)

## 2026-05-28 — PHASE 3 REVIEW: E2E and integration testing infrastructure
VERDICT: APPROVE
FINDINGS: 1 total (0 critical, 0 high, 1 medium, 0 low)
COVERAGE: HIGH
CONFIDENCE: 94 → 100/100 (1 fixed)
DEFERRED: none
ALIGNMENT: DRIFTED (CI, Dockerfile, railway.toml off-scope but related + 23 ruff formatting files)
TIER: mvp | DRIFT: none
TICK: ✅
FIXES: renamed test_case_create_and_list → test_case_create_returns_valid_schema (removed unnecessary list round-trip)

## 2026-05-28 — PHASE EXEC COMPLETE: Phase 3 — E2E and integration testing infrastructure
TIER: mvp
TASKS: 4 tasks, 2 commits (aeae26b, 4312ad3)
DEVIATIONS: 1 minor (Dockerfile chown fix — scope creep from Phase 2 ownership bug)
EVIDENCE: .kdbp/evidence/phase-3/smoke-test-report.md
RESULTS: 6/6 smoke tests pass against https://nmkgn-app-production.up.railway.app
NOTABLE: Railway Alembic releaseCommand never ran successfully — tables were missing. Migrated manually via public DATABASE_URL.

## 2026-05-28 — PUSH: Phase 2 — Railway deployment and production config
COMMITS: 5 (984f62f..b4a6894)
REMOTE: origin/main
PHASE STATUS: Exec ✅ | Review ✅ | Commit ✅ | Push ✅
ADVANCED: Current Phase → 3 (E2E and integration testing infrastructure)

## 2026-05-28 — [5f2489c] fix(deploy): harden Dockerfile and add deployment tests
FINDINGS: 0 (all pass)
ACTIONS: none
PHASE: 2 — Railway deployment and production config (review fixes)

## 2026-05-28 — PHASE 2 REVIEW: Railway deployment and production config
VERDICT: APPROVE
FINDINGS: 4 total (0 critical, 0 high, 2 medium, 2 low)
COVERAGE: LOW → HIGH (6 tests added)
CONFIDENCE: 75 → 100/100 (all 4 fixed)
DEFERRED: none
ALIGNMENT: DRIFTED (scope updated — api/config.py, api/main.py added; vite.config.ts, package.json removed)
TIER: mvp | DRIFT: none
TICK: ✅
FIXES: +USER appuser in Dockerfile, +test_config.py (3 tests), +test_spa.py (3 tests), -startCommand from railway.toml

## 2026-05-28 — PLAN UPDATE: Insert Phase 3 (E2E testing), renumber Phases 3-6 → 4-7
CHANGE: New Phase 3 inserted — E2E and integration testing infrastructure (Playwright Python, smoke tests against local + Railway URL)
TIER: mvp (no dim overrides)
DECISIONS: D34
RENUMBERED: old Phase 3→4, 4→5, 5→6, 6→7

## 2026-05-28 — DEPLOY VERIFIED: Phase 2 — Railway deployment
EXEC: ✅ (was 🔄)
URL: https://nmkgn-app-production.up.railway.app
HEALTH: /api/health → 200 OK
SPA: / → 200, index.html served with hashed assets
RELEASE_CMD: alembic upgrade head (7 migrations applied)
FIXES APPLIED:
  - [7564094] fix(deploy): hardcode port 8080 ($PORT not expanded)
  - [66823ec] fix(deploy): normalize DATABASE_URL to psycopg3 driver
EVIDENCE: .kdbp/evidence/phase-2/deploy-verification.md

## 2026-05-28 — [984f62f] feat(deploy): add Railway deployment config with Dockerfile, railway.toml, and SPA serving
FINDINGS: 4 (0 critical, 0 high, 3 medium, 1 low)
ACTIONS: 1-3:update-structure 4:accept

## 2026-05-28 — PLAN UPDATE: Insert Phase 2 (Railway deployment), renumber Phases 2-5 → 3-6
CHANGE: New Phase 2 inserted — Railway deployment and production config
TIER: mvp (Rollback→ent, Migration→ent per red-line)
DECISIONS: D33
RENUMBERED: old Phase 2→3, 3→4, 4→5, 5→6
CURRENT PHASE: 2

## 2026-05-27 — PUSH: Phase 1 — Run audit timeline and observability
COMMITS: 6 (a4067d8..268a3a1)
REMOTE: origin/main
PHASE STATUS: Exec ✅ | Review ✅ | Commit ✅ | Push ✅

## 2026-05-27 — REVIEW COMPLETE: Phase 1 — Run audit timeline and observability
SCORE: 88/100 → 100/100 (all 4 findings resolved)
FINDINGS: 4 (0 critical, 0 high, 1 medium, 3 low)
ACTIONS: 1:update-docs 2:update-docs 3:extract 4:fix

## 2026-05-27 — [17051c1] refactor(analysis): extract finding specs and update architecture docs
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none

## 2026-05-27 — [c6f7805] feat(audit): wire run-level audit timeline, warnings, and suppressed findings into analysis service
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none

## 2026-05-27 — EXEC COMPLETE: Phase 1 — Run audit timeline and observability
TASKS: T1-T4
FILES:
  - api/models/analysis.py (modified — 3 JSON audit columns)
  - api/migrations/versions/20260527_0007_add_audit_columns.py (new — migration)
  - api/services/audit.py (new — AuditEvent, RunAuditTimeline, AnalysisSetup, prepare_analysis, error classes)
  - api/services/analysis.py (modified — refactored to use audit.py, timeline integration)
  - tests/api/test_audit.py (new — 20 tests)
  - tests/api/test_analysis_api.py (modified — fix pre-existing assertion for as_missing findings)
  - tests/api/test_consumer_credit_calculations.py (modified — same fix)
PENDING: #4 resolved (duplicated setup extracted to prepare_analysis)
TESTS: 190 passed, 0 failed
EXEC COLUMN: 🔄 → ✅

## 2026-05-27 — PLAN CREATED: Evidence Export, Audit, and Production Guardrails (REQ-12, REQ-13)
PHASES: 5 | COMPLEXITY: medium × 4, high × 1 | MATURITY: mvp
TIERS: ent × 5 | PROTOTYPES: 0
DECISIONS: D28 → D32 (5 phase tier decisions logged)
ROADMAP: Phase 7 (REQ-12, REQ-13)
RISKS: SR-01 advice boundary on draft gen (high), retention blocking dev (medium), PENDING #4 duplication (low — fold into Phase 1)

## 2026-05-27 — PUSH: Phase 3 — After-signing UI presentation and docs
COMMITS: 3 (f5b033d..a4067d8)
REMOTE: origin/main
DEPLOYMENTS: P19
PUSH COLUMN: ⬜ → ✅

## 2026-05-27 — REVIEW: Phase 3 — After-signing UI presentation and docs
CONFIDENCE: 93 → 100/100
FINDINGS: 2 (0 critical, 0 high, 1 medium, 1 low)
ACTIONS: 1:fix (extract cards to FindingCards.tsx, 834→405 lines), 2:fix (unify 6 cards → 3 shared components)
VERDICT: APPROVE
ALIGNMENT: ALIGNED
REVIEW COLUMN: ⬜ → ✅

## 2026-05-27 — [4094a27] feat(ui): add path-aware after-signing finding presentation with grouped layout
FINDINGS: 1 (0 critical, 0 high, 1 medium, 0 low)
ACTIONS: 1:update-docs (V0_ALIGNMENT.md step 7 updated with path-aware grouped layout description)

## 2026-05-27 — EXEC COMPLETE: Phase 3 — After-signing UI presentation and docs
TASKS: T1-T4 code + T5 runtime evidence
FILES:
  - src/screens/AnalysisResults.tsx (+313: AsGroup types, classify/group functions, 3 card components, grouped render block, path-aware header/disclaimer/labels)
  - docs/architecture.md (after-signing UI description updated to 3-section grouped layout)
RUNTIME EVIDENCE:
  - Command: `python3 .kdbp/evidence/phase-3/capture_after_signing.py`
  - Target: Chromium headless via Python Playwright (route-intercepted mock API)
  - Artifacts:
    - .kdbp/evidence/phase-3/03-after-signing-grouped-layout.png (full page)
    - .kdbp/evidence/phase-3/04-discrepancies-section.png (3 cards, severity + refs)
    - .kdbp/evidence/phase-3/05-discrepancy-expanded-evidence.png (evidence chain: calculo + referencia oficial)
    - .kdbp/evidence/phase-3/06-escalation-section.png (3 escalation cards with SERNAC/Ley refs)
    - .kdbp/evidence/phase-3/07-escalation-expanded.png (expanded evidence chain)
    - .kdbp/evidence/phase-3/08-missing-context-section.png (2 missing-context cards with "Pendiente" pill)
  - All 3 groups visible: discrepancies (red border, severity), escalation (accent border, ref pills), missing_context (amber, Pendiente)
EXEC COLUMN: 🔄 → ✅

## 2026-05-28 — PUSH: Phase 2 — After-signing agent enrichment
COMMITS: 3 (4808607..a63ce15)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 2 COMPLETE: all 4 columns ✅ — advancing to Phase 3

## 2026-05-28 — REVIEW: Phase 2 — After-signing agent enrichment
CONFIDENCE: 98/100
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:accept (Scale-gate file size)
VERDICT: APPROVE
ALIGNMENT: ALIGNED
REVIEW COLUMN: ⬜ → ✅

## 2026-05-28 — [4808607] feat(agent): enrich FakeProvider after-signing path
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
FILES: api/services/consumer_credit_provider.py (+177), tests/api/test_consumer_credit_agent.py (+181/-4)
PHASE: 2 — After-signing agent enrichment
EXEC COLUMN: ⬜ → ✅
COMMIT COLUMN: ⬜ → ✅

## 2026-05-28 — PUSH: Phase 1 — After-signing deterministic analysis service
COMMITS: 2 (e47fa87..9383bf9)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 1 COMPLETE: all 4 columns ✅ — advancing to Phase 2

## 2026-05-28 — REVIEW: Phase 1 — After-signing deterministic analysis service
CONFIDENCE: 98/100 (post-triage)
FINDINGS: 2 (0 critical, 0 high, 1 medium, 1 low)
ACTIONS: 1:fix (agent-path test gap → 2 tests added in TestAfterSigningAgentAnalysis), 2:accept (Scale-gate duplication)
VERDICT: APPROVE
ALIGNMENT: ALIGNED
REVIEW COLUMN: ⬜ → ✅
FIX FILES: tests/api/test_consumer_credit_agent.py (+40)

## 2026-05-27 — [e47fa87] feat(analysis): add after-signing deterministic analysis
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
FILES: api/services/after_signing.py (+236), api/services/analysis.py (+17/-1), tests/api/test_after_signing.py (+290), tests/api/test_before_signing.py (+0/-6)

## 2026-05-27 — PLAN CREATED: After-Signing Discrepancy Path (REQ-10)
PHASES: 3 | COMPLEXITY: medium overall | MATURITY: mvp
TIERS: ent × 3 | PROTOTYPES: 0
DECISIONS: D25 → D27 (3 phase tier decisions logged)

## 2026-05-27 — PUSH: Phase 4 — Before-signing UI and finding presentation
COMMITS: 2 (0e34a86..a9c9e7f)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 4 COMPLETE: all 4 columns ✅
PLAN COMPLETE: all 4 phases ✅ — ready for /gabe-plan complete

## 2026-05-27 — [0e34a86] feat(ui): add path-aware before-signing finding presentation with grouped layout
FINDINGS: 0 (lint clean, types clean, 58 tests pass)
ACTIONS: none
DEFERRED: 0
PHASE: 4 — Before-signing UI and finding presentation
COMMIT COLUMN: ⬜ → ✅
REVIEW COLUMN: ⬜ → ✅ (inline — no separate review findings)

## 2026-05-27 — Phase 4 Exec (T1-T4): Before-signing UI and finding presentation
FILES: src/screens/AnalysisResults.tsx, docs/architecture.md
TASKS: T1 path-aware branching, T2 questions-first grouping, T3 key-term inline references, T4 missing-info intake prompts
RUNTIME EVIDENCE: Playwright headless Chromium screenshots
  - .kdbp/evidence/phase-4/01-bs-findings-empty.png (before-signing empty state with cautious language)
  - .kdbp/evidence/phase-4/02-as-findings-empty.png (after-signing regression — unchanged)
  - .kdbp/evidence/phase-4/03-no-case-edge.png (no-case guard state)
TYPESCRIPT: tsc --noEmit clean
T5 FULL-STACK JOURNEY: blocked — Docker/PostgreSQL not available in WSL2. Playwright screenshots cover UI rendering paths.
EXEC STATE: ⬜ → ✅

## 2026-05-27 — PUSH: Phase 3 — Before-signing agent orchestration
COMMITS: 2 (ab3bfc3..e362bcd)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 3 COMPLETE: all 4 columns ✅

## 2026-05-27 — REVIEW: Phase 3 — Before-signing agent orchestration
SCOPE: api/services/consumer_credit_provider.py, api/services/analysis.py, tests/api/test_consumer_credit_agent.py, docs/architecture.md
CONFIDENCE: 98/100
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:skip (D4 Times Deferred 1→2, Scale-tier)
DEFERRED: D4 incremented
VERDICT: APPROVE — no findings above MVP gate
REVIEW COLUMN: ⬜ → ✅

## 2026-05-27 — [ab3bfc3] feat(agent): wire before-signing path into consumer credit provider and agent analysis
FINDINGS: 0 (lint clean, 58 tests pass)
ACTIONS: none
DEFERRED: 0
PHASE: 3 — Before-signing agent orchestration
COMMIT COLUMN: ⬜ → ✅

## 2026-05-27 — PUSH: Phase 2 — Before-signing deterministic analysis
COMMITS: 4 (4416cc7..62bd150)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 2 COMPLETE: all 4 columns ✅

## 2026-05-27 — REVIEW: Phase 2 — Before-signing deterministic analysis
SCOPE: api/services/before_signing.py, api/services/analysis.py, tests/api/test_before_signing.py, tests/api/test_analysis_api.py, tests/api/conftest.py, docs/architecture.md
CONFIDENCE: 96/100 → 100/100 (post-triage)
FINDINGS: 2 (0 critical, 0 high, 0 medium, 2 low)
ACTIONS: 1:fix (batch N+1 reference queries) 2:fix (extract shared conftest.py fixture)
DEFERRED: none
VERDICT: APPROVE — no findings above MVP gate
REVIEW COLUMN: ⬜ → ✅

## 2026-05-27 — [4416cc7] feat(analysis): add before-signing deterministic analysis with reference evidence, missing-info findings, and negotiation questions
FINDINGS: 1 (1 critical, 0 high, 0 medium, 0 low)
ACTIONS: 1:auto-fix (ruff F401 unused import)
DEFERRED: 0
PHASE: 2 — Before-signing deterministic analysis

## 2026-05-26 — PUSH: Phase 1 — Path-aware routing and before-signing schemas
COMMITS: 7 (c4b4443..fb0023d)
REMOTE: origin/main
PUSH COLUMN: ⬜ → ✅
PHASE 1 COMPLETE: all 4 columns ✅

## 2026-05-26 — REVIEW: Phase 1 — Path-aware routing and before-signing schemas
SCOPE: api/services/analysis.py, api/routes/analysis.py, tests/api/test_analysis_api.py, docs/architecture.md
CONFIDENCE: 91/100
FINDINGS: 2 (0 critical, 0 high, 0 medium, 2 low)
ACTIONS: 1:defer (D4 Times Deferred 0→1) 2:accept
DEFERRED: D4 incremented
VERDICT: PASS — no findings above MVP gate
REVIEW COLUMN: ⬜ → ✅

## 2026-05-26 — [b63a786] test(analysis): add before-signing deterministic path and invalid plan tests
FINDINGS: 0
ACTIONS: none
DEFERRED: 0
PHASE: 1 — Path-aware routing and before-signing schemas

## 2026-05-26 — [48dddf0] feat(analysis): wire analysis_plan validation into run_agent_analysis
FINDINGS: 0
ACTIONS: none
DEFERRED: 0
PHASE: 1 — Path-aware routing and before-signing schemas

## 2026-05-26 — [ba11d29] refactor(analysis): wire analysis_plan routing into run_deterministic_analysis
FINDINGS: 0
ACTIONS: none
DEFERRED: 0
PHASE: 1 — Path-aware routing and before-signing schemas

## 2026-05-26 — [c4b4443] feat(analysis): add before-signing finding specs and plan-aware routing foundation
FINDINGS: 1 (0 critical, 0 high, 1 medium, 0 low)
ACTIONS: 1:update-docs
DEFERRED: 0
PHASE: 1 — Path-aware routing and before-signing schemas

## 2026-05-26 — PLAN CREATED: Before-signing review path (Roadmap Phase 5)
GOAL: Provide a before-signing analysis path with key terms, bounded comparisons, negotiation questions, and missing information
PHASES: 4 (all enterprise tier)
TIERS: mvp x 0, ent x 4, scale x 0 | PROTOTYPES: 0
DECISIONS: D21 → D24 (4 phase tier decisions)
ROADMAP: Phase 5 (REQ-09)

## 2026-05-26 — PLAN COMPLETED: Consumer-credit analysis engine
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-26_consumer-credit-analysis.md
PHASES COMPLETED: 9 of 9
TIERS: mvp x 5, ent x 4, scale x 0 | PROTOTYPES: 0
DECISIONS: D12 → D20 (9 phase tier decisions)

## 2026-05-26 — PHASE 9 PUSH: Analysis API and source inspection UI
COMMITS: 422cde6, a6955c1, 740445a (3 commits)
TARGET: origin/main (direct push)
PR: —
CI: —
TICK: ✅ (Phase 9 complete — all columns ✅)

## 2026-05-26 — PHASE 9 REVIEW: Analysis API and source inspection UI
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 0 medium, 2 low)
COVERAGE: MEDIUM — service-layer tests cover core paths; route HTTP tests not exercised directly
CONFIDENCE: 96/100 → 100/100 (post-triage)
DEFERRED: none
ALIGNMENT: SKIP
TIER: mvp | DRIFT: none
TICK: ✅

## 2026-05-26 — [422cde6] feat(analysis): add analysis API routes, TypeScript client, evidence-backed findings UI, and service tests
FINDINGS: 1 (0 critical, 0 high, 1 medium, 0 low)
ACTIONS: 1:update-docs
DEFERRED: 0
PHASE: 9 — Analysis API and source inspection UI
FILES: api/routes/analysis.py, api/main.py, api/services/analysis.py, src/api/analysis.ts, src/screens/AnalysisResults.tsx, src/components/NavContext.tsx, src/Proto.tsx, tests/api/test_analysis_api.py, docs/architecture.md

## 2026-05-26 — PHASE 9 EXEC: Analysis API and source inspection UI
TASKS: T1-T6 (6/6 complete)
FILES:
  - api/routes/analysis.py (+93 new)
  - api/main.py (+2 -1 router registration)
  - api/services/analysis.py (+18 list_analysis_runs helper)
  - src/api/analysis.ts (+127 new)
  - src/screens/AnalysisResults.tsx (+362 new)
  - src/components/NavContext.tsx (+1 analysisRunId field)
  - src/Proto.tsx (+3 findings step wiring)
  - tests/api/test_analysis_api.py (+285 new, 11 tests)
RUNTIME JOURNEY:
  Command: python3 .kdbp/evidence/phase-9/journey.py
  Target: Chromium headless (Playwright 1.59.0)
  Browser: Chrome Headless Shell 148.0.7778.96
  Artifacts:
    - .kdbp/evidence/phase-9/01-login.png
    - .kdbp/evidence/phase-9/02-case-setup.png
    - .kdbp/evidence/phase-9/03-upload.png
    - .kdbp/evidence/phase-9/04-findings-screen.png
    - .kdbp/evidence/phase-9/05-coach-prototype.png
    - .kdbp/evidence/phase-9/06-email.png
    - .kdbp/evidence/phase-9/07-findings-revisit.png
  Result: All screens render. Findings screen shows expected "No hay caso seleccionado" state (no caseId in nav context). Navigation wiring confirmed (step 12/13).

## 2026-05-26 — PUSH P17: Phase 8 — Structured agent orchestration
ENV: production
SOURCE: main → origin/main
COMMITS: 3 (f18b834, b36d8c3, 993ba3b)
PR: — (direct push)
CI: — (none configured)

## 2026-05-26 — PHASE 8 REVIEW: Structured agent orchestration
VERDICT: APPROVE
FINDINGS: 4 total (0 critical, 1 high, 1 medium, 2 low)
COVERAGE: MEDIUM — core happy/error paths tested; term_matches_count branch untested (now fixed)
CONFIDENCE: 81/100 → 93/100 (post-triage)
DEFERRED: P3 (double-negative logic, Scale), P4 (duplicated setup, Scale)
ALIGNMENT: SKIP
TIER: ent | DRIFT: none
TICK: ✅

## 2026-05-26 — [f18b834] feat(analysis): add ConsumerCreditAgent with structured output and provider abstraction
FINDINGS: 3 (0 critical, 0 high, 0 medium, 0 low — all doc drift resolved)
ACTIONS: 1:update-docs 2:update-docs 3:update-docs
DEFERRED: 0
PHASE: 8 — Structured agent orchestration
FILES: api/agents/consumer_credit.py, api/services/consumer_credit_provider.py, api/services/analysis.py, api/config.py, tests/api/test_consumer_credit_agent.py, docs/AGENTS_USE.md, docs/architecture.md, README.md

## 2026-05-26 — PUSH main → main
COMMITS: 440beae, d6ee229, ed4c434 (3 commits)
PR: —
CI: —
PLAN: Phase 7 Push ticked ✅

## 2026-05-26 — PHASE 7 REVIEW: Official reference catalog
VERDICT: APPROVE
FINDINGS: 4 total (0 critical, 0 high, 3 medium, 1 low)
COVERAGE: HIGH — 19 tests cover CRUD, seed, schemas, validation
CONFIDENCE: 83/100 → 88/100 after fixing MVP-gate #2
ACTIONS: 1:accept 2:fix 3:accept 4:accept
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅

## 2026-05-26 — [440beae] feat(references): add official reference catalog with seed data
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-26 — PUSH main → main
COMMITS: eb315a1, a39f205, 185d7ae, a3c97ee (4 commits)
PR: —
CI: —
PLAN: Phase 6 Push ticked ✅

## 2026-05-26 — [185d7ae] test(analysis): add _build_finding_summary fallback test and record Phase 6 review
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-26 — PHASE 6 REVIEW: Deterministic discrepancy calculations
VERDICT: APPROVE
FINDINGS: 1 total (0 critical, 0 high, 1 medium, 0 low)
COVERAGE: MEDIUM — one error-handling fallback branch untested (now fixed)
CONFIDENCE: 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅

## 2026-05-26 — [a39f205] feat(analysis): add deterministic discrepancy calculations and analysis service
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: lint auto-fixed 6 unused imports
DEFERRED: none

## 2026-05-25 — PUSH main → main
COMMITS: c83e70e, 90f9ba2 (2 commits)
PR: —
CI: —
DEPLOYMENTS: P14

## 2026-05-25 — [c83e70e] chore(kdbp): record Phase 5 review and P13 push bookkeeping
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
TESTS: 81 passed

## 2026-05-25 — PHASE 5 REVIEW: Frontend gap review handoff
VERDICT: APPROVE (with advisory #1)
FINDINGS: 3 total (0 critical, 1 high, 1 medium, 1 low)
  #1 HIGH runtime evidence gap — user-facing phase lacks browser journey artifacts (accepted: batch exec, browser journey deferred to Phase 9)
  #2 MEDIUM Upload.tsx at 1219 lines (>800 threshold) — enterprise gate, accepted at MVP
  #3 LOW handleUpload() receptionist run failure error isolation — scale gate
COVERAGE: MEDIUM — 13 frontend tests cover component logic; runtime behavior not verified (jsdom limitation)
CONFIDENCE: 71/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅

## 2026-05-25 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P13 (added row to .kdbp/DEPLOYMENTS.md)
COMMITS: dfeb743, b5583d9, c603f9a (3 commits)

## 2026-05-25 — PHASE 4 REVIEW: Gap comparator, resolution, promotion, and composite readiness
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 0 high, 2 medium, 1 low) — none blocking
  #1 MEDIUM receptionist_gaps.py:115 — resolve_gap() mutates gap in place (ent gate, accepted as SQLAlchemy ORM pattern)
  #2 MEDIUM receptionist_gaps.py:496 — _apply_observation_to_fact() mutates fact in place (ent gate, accepted as SQLAlchemy ORM pattern)
  #3 LOW receptionist_gaps.py:739 — _is_required_or_high_impact() redundant subset check (scale gate)
COVERAGE: HIGH — 6 API tests cover run+gaps, extractor comparison, provider failure, accept-missing promotion, accept-conflict correction, defer-unsupported
CONFIDENCE: 90/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅

## 2026-05-25 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P12 (added row to .kdbp/DEPLOYMENTS.md)
COMMITS: edb1d53, ee583fc, c695287 (3 commits)

## 2026-05-25 — [ee583fc] refactor(receptionist): extract gap lifecycle into dedicated module
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-25 — PHASE 3 REVIEW: Multimodal media packing and run pipeline
VERDICT: APPROVE
FINDINGS: 1 total (0 critical, 0 high, 0 medium, 1 low) — all resolved
  #1 LOW receptionist.py:1014 lines (>800 threshold) → FIXED: extracted gap lifecycle to receptionist_gaps.py (296 + 747 lines)
COVERAGE: HIGH — acceptance criteria covered by test_receptionist_media.py (4 tests) and test_receptionist_api.py (6 tests)
CONFIDENCE: 100/100 (post-fix)
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅

## 2026-05-25 — PUSH main → main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P11 (added row to .kdbp/DEPLOYMENTS.md)
COMMITS: 52f0d01, 91f1dd7, 779b538 (3 commits)

## 2026-05-25 — [91f1dd7] feat(receptionist): add receptionist gate, baseline harness, and gap review UI
FINDINGS: 2 (0 critical, 0 medium structure — resolved via update-structure)
ACTIONS: 1:update-structure 2:update-structure
DEFERRED: none
STRUCTURE: +manual-test-cases/**, +manual_test_cases/** added to STRUCTURE.md

## 2026-05-25 — PHASE 2 REVIEW: Receptionist schema, persistence, and provider contract
VERDICT: APPROVE
FINDINGS: 0 total (0 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH — all acceptance criteria exercised through 6 API tests and 4 media tests; migration verified on fresh SQLite
CONFIDENCE: 100/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: ent | DRIFT: none
TICK: ✅

## 2026-05-18 19:41 — Scotiabank baseline harness execution

Executed the local-only Scotiabank baseline exercise.

- Created ignored local replay baseline:
  `manual-test-cases/baselines.local/base-degradation-scotiabank-2022/baseline.json`.
- Sanitized run:
  `manual-test-cases/runs/base-degradation-scotiabank-2022/20260518T233905Z`.
- Private detailed run:
  `manual-test-cases/runs/base-degradation-scotiabank-2022/20260518T233914Z`.
- Result: 3/3 documents uploaded and extracted, 33 pending facts, 8
  receptionist gaps, 21 baseline gaps, and analysis readiness remained blocked
  by unresolved high-impact facts plus unresolved receptionist gaps.
- Wrote sanitized and private evaluation reports under each run's `baseline/`
  folder.

Verification:

- `uv run pytest -q tests/api/test_manual_baseline.py` — passed, 7 tests.
- `uv run python manual-test-cases/run_catalog.py --help` — passed.
- Sanitized artifact grep for password/snippet/value/raw path markers — passed.
- `git check-ignore -v` confirmed the private detailed report and replay
  baseline are ignored.
- `git status --short manual-test-cases` — still shows the untracked manual
  test-case tree, as expected in this working state.
- `git diff --check` — passed.

## 2026-05-18 19:06 — Manual Consumer Credit Baseline Agent Harness

Implemented the manual-only baseline harness for fixture evaluation.

- Added importable baseline schemas, media packing, local replay, opt-in
  Anthropic provider plumbing, deterministic comparison gaps, and ignored run
  artifacts under `baseline/`.
- Extended `manual-test-cases/run_catalog.py` with `--baseline-agent`,
  `--baseline-provider`, `--baseline-model`, `--baseline-max-pages`, and
  `--allow-external-llm`.
- Documented `manual-test-cases/baselines.local/<case-id>/baseline.json` and
  added local ignore coverage for baseline replay packets.

Verification:

- `uv run pytest -q tests/api/test_manual_baseline.py` — passed, 7 tests.
- `uv run python manual-test-cases/run_catalog.py --help` — passed.
- `uv run pytest -q` — passed, 81 tests.
- `uv run ruff check` — passed.
- `uv run ruff format --check manual_test_cases/baseline.py manual-test-cases/run_catalog.py tests/api/test_manual_baseline.py` — passed.
- `git diff --check` — passed.

## 2026-05-18 13:41 — PHASE 1 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 1 commit gate.

- PLAN: Phase 1 `Commit` marked `✅`; Push remains pending.
- Included the consumer-credit analysis persistence contract, evidence
  provenance hardening, schema/migration/test coverage, architecture docs,
  tier decisions, execution ledger, and resolved review inbox state in the
  commit scope.

Verification:

- `uv run pytest -q` — passed, 58 tests.
- `uv run ruff check .` — passed.
- `uv run ruff format --check api/models/analysis.py api/models/extraction.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-analysis-phase1-commit.db uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
- `npm test` — passed, 24 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` and `git diff --cached --check` — passed.

## 2026-05-18 13:25 — PHASE 1 REVIEW: Analysis contract and persistence
VERDICT: APPROVE
FINDINGS: 1 total (1 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH — cross-run finding, cross-run calculation, and cross-case fact regression tests added during triage
CONFIDENCE: 75 -> 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/1 strict overlap, union consolidation
FIXES: #1 replaced single-column evidence FKs with composite FKs scoped to run/case, added composite unique targets on findings/calculations/facts tables, added 3 negative regression tests

## 2026-05-18 12:05 — PLAN CREATED: Build the consumer-credit analysis engine with stable structured output, deterministic discrepancy checks, official references, and evidence-backed finding presentation
PHASES: 5 | COMPLEXITY: high | MATURITY: mvp
TIERS: mvp × 4, ent × 1, scale × 0 | PROTOTYPES: 0
DECISIONS: D12 → D16 (5 phase tier decisions logged)

## 2026-05-18 11:40 — PLAN COMPLETED: Normalize consumer-credit facts and add confirmation gate
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-18_normalize-consumer-credit-facts.md
PHASES COMPLETED: 4 of 4

## 2026-05-18 11:29 — PUSH main -> main
PR: —
CI: no CI
PROMOTION: N/A
DEPLOYMENTS: P10 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-18 10:26 — PHASE 4 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 4 commit gate.

- PLAN: Phase 4 `Commit` marked `✅`; Push remains pending.
- Included the frontend fact review handoff, typed facts API client, prototype
  analysis guard, review fixes, regression tests, docs, and resolved review
  inbox state in the commit scope.

Verification:

- `npm test` — passed, 24 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest` — passed, 51 backend tests.
- `uv run ruff check` — passed.
- `git diff --check` — passed.

## 2026-05-18 10:22 — PHASE 4 REVIEW: Frontend fact review handoff

VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 2 high, 0 medium, 0 low)
COVERAGE: HIGH — upload/fact-refresh and correction-validation regressions
added during review
CONFIDENCE: 76 -> 96/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5)
FIXES: #1 kept a successfully saved upload out of the outer upload-failure path
when fact-readiness refresh fails; #2 rejected correction strings with no digits
before they can normalize to `0`.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 14 tests.
- `npm test` — passed, 24 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest` — passed, 51 backend tests.
- `uv run ruff check` — passed.
- `git diff --check` — passed.

## 2026-05-17 18:32 — PHASE 4 EXECUTION COMPLETE

Implemented the frontend fact review handoff.

- Added a typed facts API client for listing candidates, reading readiness, and
  recording confirm/correct/reject decisions.
- Extended the upload handoff with fact-candidate review, source snippets,
  status summaries, missing-required-field blockers, and correction controls.
- Added navigation state and a prototype-analysis guard that blocks later
  analysis screens until case readiness is open and the prototype acknowledgement
  is accepted.
- Updated docs to reflect that facts can now be reviewed while analysis/results
  remain prototype surfaces.
- PLAN: Phase 4 `Exec` marked `✅`; Review remains pending.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 12 tests.
- `npm test` — passed, 22 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run pytest tests/api/test_facts_api.py` — passed, 7 backend tests.
- `uv run pytest` — passed, 51 backend tests.
- `git diff --check` — passed.

## 2026-05-17 18:25 — PHASE 4 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 4: Frontend fact review
handoff.

- PLAN: advanced from completed Phase 3 to Phase 4; Phase 4 `Exec` marked
  `🔄`.
- Scope is the frontend fact review handoff: API client/state, source snippets,
  confirm/correct/reject controls, unresolved fact summaries, and guardrails
  before prototype analysis.

## 2026-05-17 17:27 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P9 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-17 17:21 — PHASE 3 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 3 commit gate.

- PLAN: Phase 3 `Commit` marked `✅`; Push remains pending.
- Included owner-scoped fact listing, confirmation/correction/rejection,
  case-level readiness blockers, review fixes, API tests, architecture docs,
  and review inbox state in the commit scope.

Verification:

- `uv run pytest` — passed, 51 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run ruff check` — passed.
- `uv run ruff format --check api/main.py api/schemas/__init__.py api/schemas/facts.py api/routes/facts.py api/services/facts.py tests/api/test_facts_api.py` — passed, changed Python files already formatted.
- `git diff --check` — passed.
- Note: repo-wide `uv run ruff format --check` still reports pre-existing
  formatting drift in untouched Python files.

## 2026-05-15 18:42 — PHASE 3 REVIEW: Confirmation API and analysis gate
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 0 medium, 1 low)
COVERAGE: HIGH — type-incompatible correction validation test and list/readiness 404 tests added during triage
CONFIDENCE: 81 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 added value_kind-compatible correction validation with _validate_correction_compatibility() and InvalidCorrectionError → 422, #2 added 404 tests for list_facts and readiness on nonexistent case

## 2026-05-15 18:16 — PHASE 3 EXECUTION COMPLETE

Implemented the owner-scoped fact confirmation API and readiness gate.

- Added fact review service and routes for listing fact candidates, recording
  confirm/correct/reject decisions, and reporting case-level readiness blockers.
- Readiness now blocks analysis while any high-impact candidate remains pending
  or a required high-impact fact key has no candidate.
- Corrections preserve original extracted values and store corrected values on
  confirmation records.
- Updated architecture docs with the fact review boundary and API endpoints.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_facts_api.py` — passed, 5 tests.
- `uv run pytest` — passed, 49 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 18:10 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Confirmation API and
analysis gate.

- PLAN: Phase 3 `Exec` marked `🔄`.
- Scope is owner-scoped fact listing, confirmation/correction/rejection, and a
  case-level readiness state that blocks analysis until required high-impact
  facts are resolved.

## 2026-05-15 18:03 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P8 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 17:55 — PHASE 2 COMMIT GATE

Prepared `/gabe-next` routed through the Phase 2 commit gate.

- PLAN: Phase 2 `Commit` marked `✅`; Push remains pending.
- Included deterministic fact extraction, review fixes, regression coverage, and
  architecture/KDBP bookkeeping in the commit scope.

Verification:

- `uv run pytest` — passed, 44 backend tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 17:45 — PHASE 2 REVIEW: MVP fact extraction service
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 2 high, 0 medium, 0 low)
COVERAGE: HIGH — bare-currency regression test and fact-extraction-failure isolation test added during triage
CONFIDENCE: 71 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 require explicit CLP marker ($, clp, pesos) before setting value_currency — bare numbers leave currency unresolved, #2 wrap fact extraction in savepoint so text extraction completes independently on failure

## 2026-05-15 16:40 — PHASE 2 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 2: MVP fact extraction service.

- PLAN: Phase 2 `Exec` marked `🔄`.
- Scope remains deterministic local extraction from existing extracted text
  segments; OCR, LLM extraction, confirmation APIs, readiness gates, and
  findings stay out of scope.

## 2026-05-15 17:15 — PHASE 2 EXECUTION COMPLETE

Implemented deterministic MVP fact extraction from persisted text segments.

- Added `api/services/fact_extraction.py` with local rules for principal amount,
  currency, contract date, term, payment count, installment amount, interest
  rate, CAE, total cost, fees, insurance signals, linked products, and relevant
  clauses.
- Wired text extraction to clear stale pending facts and create pending fact
  candidates after successful consumer-credit text extraction.
- Missing or ambiguous required high-impact values are persisted as warning
  candidates instead of fabricated facts.
- Updated `docs/architecture.md` with the new fact-candidate boundary.
- PLAN: Phase 2 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_fact_extraction.py tests/api/test_documents_api.py`
  — passed, 21 tests.
- `uv run pytest` — passed, 42 tests.
- `npm test` — passed, 21 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-12 - gabe-init

Initialized KDBP for `nmkgn` as a hybrid MVP and agent-app documentation
profile. Seeded the first durable scope from `docs/V0_ALIGNMENT.md`.

## 2026-05-13 - Phase 1 started

Started ROADMAP Phase 1: Product Backbone and Case Intake.

- T1 in progress: structure standard will be updated for Alembic and Python
  package files.
- Implementation target: React/Vite case intake, FastAPI under `api/`,
  PostgreSQL persistence, Alembic migrations, and stub owner `demo-user`.

## 2026-05-13 - Phase 1 execution complete

Implemented ROADMAP Phase 1 execution scope.

- Added FastAPI app under `api/` with health and case endpoints.
- Added SQLAlchemy case model, DB session helper, Alembic environment, and
  initial `cases` migration.
- Added PostgreSQL local service under `docker/compose.yml`.
- Added backend tests for health, validation, create/list/read, ownership scope,
  and Alembic upgrade.
- Added React case setup screen before upload, API client, navigation case state,
  and stub login flow.
- Added focused frontend tests for case setup validation, successful submit, and
  API failure handling.
- Fixed React fast-refresh lint issue by moving `LENSES` data out of the
  component module.

Verification:

- `uv run pytest` — passed, 6 tests.
- `npm test` — passed, 3 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `docker compose -f docker/compose.yml up -d postgres` — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against
  local PostgreSQL.
- FastAPI `POST /api/cases` + `GET /api/cases/{id}` smoke — passed against
  local PostgreSQL with case id `472c40f7-dd2b-4d55-9afd-0634a786e553`.

## 2026-05-13 - Local port registry

Moved nmkgn local development off common workstation defaults.

- Registered ports in `.kdbp/PORTS.md`.
- Web app: `15179`.
- Vite preview: `15180`.
- FastAPI API: `18080`.
- PostgreSQL host port: `55432`.
- Updated package scripts, frontend API default, backend database/CORS defaults,
  Docker Compose port mapping, and frontend tests.
- Verified registered stack:
  - `npm run db:up` — passed; `nmkgn-postgres-1` healthy on `127.0.0.1:55432`.
  - `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
  - `uv run pytest` — passed, 6 tests.
  - `npm test` — passed, 3 tests.
  - `npm run lint` — passed.
  - `npm run build` — passed.
  - `GET http://127.0.0.1:18080/api/health` — passed.
  - `GET http://127.0.0.1:15179/` — passed.
  - `POST http://127.0.0.1:18080/api/cases` — passed with case id
    `1805f90b-14b3-4584-8d49-65275bdd5589`.
- Started detached dev sessions:
  - `tmux` session `nmkgn-api` runs `npm run api:dev`.
  - `tmux` session `nmkgn-web` runs `npm run dev`.

## 2026-05-13 - Phase 1 alignment cleanup

Addressed immediate `/gabe-align` concerns.

- Added an upload-step prototype guard so a persisted real case cannot enter the
  old mock analysis flow until the user acknowledges that later screens still
  use simulated findings.
- Added frontend validation for optional numeric fields so typed invalid amounts
  or terms are not silently omitted from the case payload.
- Added frontend tests for the numeric validation and prototype guard.
- Deferred Phase 2 provenance-ready persistence and config consolidation in
  `.kdbp/PENDING.md`.

Verification:

- `npm test` — passed, 7 tests.
- `uv run pytest` — passed, 6 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- `GET http://127.0.0.1:18080/api/health` — passed.
- `GET http://127.0.0.1:15179/` — passed.

## 2026-05-13 17:31 — PHASE 1 REVIEW: Product Backbone and Case Intake
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 3 high, 0 medium, 0 low)
COVERAGE: HIGH — all 3 findings now covered by tests (7 backend, 9 frontend)
CONFIDENCE: 90/100
DEFERRED: none
ALIGNMENT: DRIFTED (justified — port registration and alignment cleanup alongside plan scope)
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 3/3 strict overlap
FIXES: #1 go() guard blocks mock analysis steps without prototype ack, #2 Upload locks non-credit doc types for persisted cases, #3 Pydantic model_validator rejects stage/plan mismatch

## 2026-05-13 17:40 — PHASE 1 COMMIT GATE

Prepared `/gabe-next` routed through `/gabe-commit` for Phase 1.

- Updated architecture docs with the implemented case model, API endpoints,
  owner scoping, stage/analysis-plan constraints, and registered local ports.
- Updated V0 alignment docs with the active Phase 1 path:
  login -> case setup -> persisted consumer-credit case -> upload handoff.
- Marked the Phase 1 commit column complete; push remains pending.

Verification:

- `uv run pytest` — passed, 7 backend tests.
- `npm test` — passed, 9 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against
  local PostgreSQL on `127.0.0.1:55432`.
- `git diff --check` — passed.
- `GET http://127.0.0.1:18080/api/health` — passed.
- `GET http://127.0.0.1:15179/` — passed.
- `docker compose -f docker/compose.yml ps` — PostgreSQL healthy.

## 2026-05-13 19:20 — PHASE 2 EXECUTION: Claude Design Intake and Case-Flow Gap Analysis

Implemented the design-intake phase for the Claude export under
`docs/design/incoming/claude-design-20260513/`.

- Removed `nmkgn.zip:Zone.Identifier` from the curated import and ignored future
  Windows zone metadata files.
- Preserved the useful Claude HTML, JSX, screenshot, canvas-state, and asset
  files as reference material.
- Added a package manifest at
  `docs/design/incoming/claude-design-20260513/MANIFEST.md`.
- Added `docs/design/CLAUDE_20260513_INVENTORY.md`.
- Added `docs/design/CLAUDE_20260513_GAP_ANALYSIS.md`.
- Updated structure rules to allow `docs/design/incoming/**`.
- Registered optional static design preview port `15181`.
- Added Phase 2 to the active KDBP plan with execution complete and review,
  commit, and push pending.
- Left `src/`, `api/`, migrations, tests, and runtime behavior unchanged.

Verification:

- `git diff --check` — passed.
- `git status --short -uall` — checked; changed files are limited to
  design-intake/KDBP/reference material.
- Static preview smoke on `127.0.0.1:15181` — passed for:
  - `letra. · Main flow.html`
  - `wireframes.html`
  - `Coach · Hi-fi explorations.html`
- `npm run lint` — passed.
- `npm run build` — passed.
- `ss -ltn sport = :15181` — no lingering preview server.

## 2026-05-13 19:37 — PHASE 2 REVIEW: Claude Design Intake and Case-Flow Gap Analysis

VERDICT: APPROVE
FINDINGS: 0 total (0 critical, 0 high, 0 medium, 0 low)
COVERAGE: HIGH — checked KDBP state, design manifest, inventory, gap analysis,
imported reference files, static preview, and regression gates.
CONFIDENCE: 96/100
DEFERRED: none
ALIGNMENT: ALIGNED — changed files are limited to design-intake/KDBP/reference
material; no product runtime files changed.
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5)

Verification:

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- Static preview smoke on `127.0.0.1:15181` — passed for:
  - `letra. · Main flow.html`
  - `wireframes.html`
  - `Coach · Hi-fi explorations.html`
- `find docs/design/incoming/claude-design-20260513 -name '*:Zone.Identifier'`
  — no matches.
- `ss -ltn sport = :15181` — no lingering preview server.

## 2026-05-13 19:45 — [9766c9d] docs(design): add Claude design intake, inventory, and gap analysis
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-13 19:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P1 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 09:07 — PLAN UPDATED: Product Backbone and Case-Flow Alignment

CHANGE: Refreshed the active plan after Phase 1 and Phase 2 completion, normalized
the phase tracker cells to `✅` / `⬜`, advanced `## Current Phase` to Phase 3,
and added "Case Flow UI Alignment from Claude Design" as the next executable
phase.

- Wrote only `.kdbp/PLAN.md` and `.kdbp/LEDGER.md`; `SCOPE.md` and
  `ROADMAP.md` remain `/gabe-scope*` surfaces.
- Phase 3 is based on `docs/design/CLAUDE_20260513_GAP_ANALYSIS.md` and keeps
  real upload persistence, OCR, agents, and unrestricted document types out of
  scope.

## 2026-05-14 09:09 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Case Flow UI Alignment from
Claude Design.

- PLAN: Phase 3 `Exec` marked `🔄`.
- Scope remains UI/state alignment only; backend persistence, OCR, agents,
  history/settings/share/email, and unrestricted document types stay out of
  scope.

## 2026-05-14 09:35 — PHASE 3 EXECUTION COMPLETE

Implemented Phase 3 case-flow UI alignment from the curated Claude design
reference.

- Added persistent case context and prototype-state notices across the post-case
  flow.
- Refreshed login/case setup/upload framing while preserving persisted
  `consumer_credit` case creation, unsupported document locks, and the prototype
  acknowledgement guard.
- Added prototype-only detection branches for ready, low confidence,
  unsupported, and failed states.
- Added responsive structure for the key case-flow layouts.
- Added focused frontend coverage for detection branch routing and upload branch
  selection.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `npm test` — passed, 14 frontend tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-14 10:16 — PHASE 3 REVIEW: Case Flow UI Alignment from Claude Design
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 0 high, 1 medium, 1 low)
COVERAGE: MEDIUM — detection branch routing and upload scenario selection tested; responsive/viewport not exercisable in jsdom
CONFIDENCE: 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap
FIXES: #1 revised acceptance text + added responsive class-name tests, #2 replaced fragile CSS attribute selector with .app-content-area class

## 2026-05-14 10:19 — [a6449d9] feat(screens): align case-flow UI to Claude design reference
FINDINGS: 0 (0 critical, 0 high, 0 medium, 0 low)
ACTIONS: none
DEFERRED: none

## 2026-05-14 10:20 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P2 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 10:21 — PLAN COMPLETED: Product Backbone and Case-Flow Alignment
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-14_product-backbone-case-flow.md
PHASES COMPLETED: 3 of 3

## 2026-05-14 10:29 — PLAN CREATED: Real document upload persistence and text extraction

PHASES: 4 | COMPLEXITY: medium | MATURITY: mvp
TIERS: mvp x 4, ent x 0, scale x 0 | PROTOTYPES: 0
DECISIONS: D4 -> D7 (4 phase tier decisions logged)
RELATED: PENDING #1, PENDING #2, ROADMAP Phase 2, and the text-extraction bridge into ROADMAP Phase 3

## 2026-05-14 10:35 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Storage contract and schema.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is schema/config/docs only: no upload endpoint, extraction service,
  OCR provider, frontend behavior, or agent/finding pipeline changes.

## 2026-05-14 10:40 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 storage contract and schema.

- Added env-backed upload storage settings and `.env.example`.
- Added document and extracted-text SQLAlchemy models.
- Added document/extracted-text Pydantic schemas.
- Added Alembic migration `20260514_0002_create_documents`.
- Added contract tests for upload settings, document roles, text span validation,
  model persistence, and migration-created tables.
- Updated architecture and agent docs with the document/text boundary.
- Updated `.kdbp/STRUCTURE.md` to allow `.env.example`.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 11 tests.
- `uv run pytest` — passed, 11 API tests.
- `git diff --check` — passed.
- `npm run db:up` — passed; PostgreSQL container running.
- `uv run alembic -c api/migrations/alembic.ini upgrade head` — passed against local PostgreSQL.

## 2026-05-14 16:38 — PHASE 1 REVIEW: Storage contract and schema
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 0 high, 2 medium, 1 low)
COVERAGE: MEDIUM — API contract tests and SQLite Alembic passed; live PostgreSQL migration not rerun because Docker is unavailable in this WSL distro
CONFIDENCE: 92/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
FIXES: added upload-config bound validation, complete extracted-text locator validation, SHA-256 hex validation, and matching tests

## 2026-05-14 16:45 — [2f448bb] feat(storage): add document and extraction schema with provenance-ready storage contract
FINDINGS: 4 (2 critical, 1 high, 1 low)
ACTIONS: 1:fix 2:fix 3:resolve-now 4:update-docs
DEFERRED: none
RESOLVED: PENDING #1 (provenance-ready persistence — addressed by this commit)

## 2026-05-14 16:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P3 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 21:31 — PHASE 2 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 2: Backend ingestion API.

- PLAN: Current Phase advanced from Phase 1 to Phase 2; Phase 2 `Exec` marked `🔄`.
- Scope is backend ingestion only: multipart upload, owner/case validation,
  local file persistence, document metadata reads, and backend tests.
- Out of scope: text extraction, OCR, frontend upload wiring, public file
  serving, antivirus scanning, and production storage hardening.

## 2026-05-14 21:35 — PHASE 2 EXECUTION COMPLETE

Implemented Phase 2 backend ingestion API.

- Added multipart document upload endpoints under `/api/cases/{case_id}/documents`.
- Added scoped document listing and metadata read endpoints.
- Added local upload storage service with filename/path sanitization,
  checksum calculation, byte-size enforcement, content-type enforcement,
  delete-after metadata, and rollback cleanup for rejected writes.
- Added `python-multipart` for FastAPI form/file parsing.
- Added backend API coverage for successful upload persistence, stub-owner
  scoping, other-owner case rejection, unsupported media types, oversize
  payload cleanup, and metadata reads.
- PLAN: Phase 2 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_api.py tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 22 tests.
- `uv run ruff format --check api/routes/documents.py api/services/documents.py tests/api/test_documents_api.py api/main.py` — passed.
- `uv run ruff check .` — passed.
- `uv run pytest -q` — passed, 22 tests.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports 12 pre-existing backend/test files outside this Phase 2 change that would be reformatted.

## 2026-05-14 22:30 — PHASE 2 REVIEW: Backend ingestion API
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (empty file 400, storage write 500, list/read 404, plus prior happy path, owner scoping, unsupported type, oversize)
CONFIDENCE: 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/2 strict overlap, union consolidation
FIXES: #1 added empty-file and storage-write-failure tests, #2 added list/read 404 tests

## 2026-05-14 22:45 — [420c1b0] feat(documents): add scoped multipart upload, list, and read API
FINDINGS: 3 (0 critical, 1 high, 1 medium, 1 low)
ACTIONS: 1:update-docs 2:accept 3:accept
DEFERRED: none

## 2026-05-14 22:50 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P4 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-14 22:51 — PHASE 3 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 3: Text extraction pipeline.

- PLAN: Current Phase advanced from Phase 2 to Phase 3; Phase 3 `Exec` marked `🔄`.
- Scope is text extraction only: supported text-bearing uploads, persisted
  extracted text segments, status transitions, warnings/failures, and backend
  tests.
- Out of scope: OCR provider integration, background worker queues/retries,
  normalized fact extraction, findings, and frontend upload wiring.

## 2026-05-14 22:56 — PHASE 3 EXECUTION COMPLETE

Implemented Phase 3 text extraction pipeline.

- Added synchronous local extraction after document upload.
- Added `pypdf` for text-bearing PDF extraction.
- Added plain-text span segmentation and PDF page segmentation.
- Marked image uploads and text-empty PDFs as `needs_ocr`.
- Marked malformed/unreadable PDF extraction as `failed` without failing stored
  upload persistence.
- Added owner-scoped `GET /api/cases/{case_id}/documents/{document_id}/text-segments`.
- Updated architecture docs with the extraction boundary and endpoint.
- PLAN: Phase 3 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_api.py tests/api/test_documents_contract.py -q` — passed, 23 tests.
- `uv run ruff check api/services/text_extraction.py api/services/documents.py api/routes/documents.py tests/api/test_documents_api.py` — passed.
- `uv run ruff format --check api/services/text_extraction.py api/services/documents.py api/routes/documents.py tests/api/test_documents_api.py` — passed.
- `uv run pytest -q` — passed, 30 tests.
- `uv run ruff check .` — passed.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports 12 pre-existing backend/test
  files outside this Phase 3 change that would be reformatted.

## 2026-05-14 23:10 — PHASE 3 REVIEW: Text extraction pipeline
VERDICT: APPROVE
FINDINGS: 2 total (0 critical, 1 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (text-segments 404 for nonexistent case and document, decode warning for non-UTF-8, partial_pdf_text warning for mixed PDFs, plus prior happy path, needs_ocr, and failed statuses)
CONFIDENCE: 90/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 2/2 strict overlap, union consolidation
FIXES: #1 added text-segments 404 tests for nonexistent case and nonexistent document, #2 added decode_replacement warning test for non-UTF-8 plain text and partial_pdf_text warning test for mixed blank/text PDF pages

## 2026-05-15 — [b25365a] feat(extraction): add synchronous text extraction pipeline with warning tracking
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:update-docs
DEFERRED: none

## 2026-05-15 00:28 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P5 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 00:51 — PHASE 4 EXECUTION COMPLETE

Implemented Phase 4 frontend upload/status handoff.

- Added shared frontend API base/error handling in `src/api/client.ts`.
- Added document API client for upload, document listing, and text-segment reads.
- Replaced the persisted-case upload screen's prototype-only action with real
  file selection, role selection, multipart upload, server-backed document
  status, upload progress state, and extracted-text preview.
- Kept later analysis screens guarded as prototype-only until normalized facts,
  confirmations, agents, and evidence-backed findings exist.
- Updated V0 and architecture docs to reflect the real upload boundary.
- PLAN: Current Phase advanced from Phase 3 to Phase 4; Phase 4 `Exec` marked
  `✅`; Review remains pending.

Verification:

- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 8 tests.
- `npm test` — passed, 18 frontend tests.
- `uv run pytest` — passed, 34 API tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-15 01:15 — PHASE 4 REVIEW: Frontend upload/status handoff
VERDICT: APPROVE
FINDINGS: 3 total (0 critical, 2 high, 1 medium, 0 low)
COVERAGE: HIGH — all error branches now tested (POST failure, POST success + refresh failure, initial list load failure, plus prior happy path, metadata display, OCR-pending, and prototype guard)
CONFIDENCE: 61 → 95/100
DEFERRED: none
ALIGNMENT: ALIGNED
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 2/3 strict overlap, union consolidation
FIXES: #1 separated POST success from refresh failure in handleUpload to prevent duplicate-upload risk, #2 added POST-failure, refresh-failure, and list-load-failure tests, #3 documented VITE_API_BASE_URL in .env.example and updated PORTS.md reference from cases.ts to client.ts

## 2026-05-15 01:21 — [d5a6db4] feat(upload): wire frontend to real document upload, status, and text preview
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:update-docs (README.md — added VITE_API_BASE_URL mention)
DEFERRED: none

## 2026-05-15 15:33 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P6 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-15 15:33 — PLAN COMPLETED: Real document upload persistence and text extraction
ARCHIVE: .kdbp/archive/completed_PLAN_2026-05-15_document-upload-text-extraction.md
PHASES COMPLETED: 4 of 4

## 2026-05-15 15:51 — PLAN CREATED: Normalize consumer-credit facts and add confirmation gate
PHASES: 4 | COMPLEXITY: high x 2, med x 2 | MATURITY: mvp
TIERS: mvp x 4, ent x 0, scale x 0 | PROTOTYPES: 0
DECISIONS: D8 → D11 (4 phase tier decisions logged)

## 2026-05-15 15:53 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Fact contract and schema.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is schema/contract only: normalized fact persistence, confirmation
  persistence, Pydantic schemas, Alembic migration, architecture docs, and
  focused contract tests.
- Out of scope: extraction service implementation, confirmation API endpoints,
  frontend fact review, agents, findings, OCR, and exports.

## 2026-05-15 15:58 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 fact contract and schema.

- Added SQLAlchemy models for normalized consumer-credit fact candidates and
  fact confirmation records.
- Added Alembic migration `20260515_0003` for `consumer_credit_facts` and
  `fact_confirmations`.
- Added Pydantic schemas for fact creation/read and confirmation creation/read.
- Added contract tests for fact source locators, value/warning requirements,
  correction boundaries, relationships, DB constraints, and Alembic table
  creation.
- Updated architecture docs with fact/confirmation data model and boundary.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run pytest tests/api/test_documents_contract.py tests/api/test_cases.py -q` — passed, 20 tests.
- `uv run ruff check api/models/extraction.py api/models/document.py api/models/__init__.py api/schemas/__init__.py api/schemas/facts.py api/migrations/versions/20260515_0003_create_consumer_credit_facts.py tests/api/test_documents_contract.py tests/api/test_cases.py` — passed.
- `uv run ruff format --check api/models/extraction.py api/models/document.py api/models/__init__.py api/schemas/__init__.py api/schemas/facts.py api/migrations/versions/20260515_0003_create_consumer_credit_facts.py tests/api/test_documents_contract.py tests/api/test_cases.py` — passed.
- `uv run pytest -q` — passed, 37 tests.
- `uv run ruff check .` — passed.
- `git diff --check` — passed.

## 2026-05-15 16:20 — PHASE 1 REVIEW: Fact contract and schema
VERDICT: APPROVE
FINDINGS: 1 total (1 critical, 0 high, 0 medium, 0 low)
COVERAGE: MEDIUM — cross-provenance regression test added during triage; text_segment/document consistency accepted as MVP limitation
CONFIDENCE: 75 → 95/100
DEFERRED: none
ALIGNMENT: DRIFTED (workflow state alongside plan scope — no implementation risk)
TIER: mvp | DRIFT: none
TICK: ✅
SOURCES: codex (gpt-5) + claude (claude-opus-4-6) — cross-agent triangulation, 1/1 strict overlap, union consolidation
FIXES: #1 replaced independent case_id/document_id FKs with composite FK (document_id, case_id) → (documents.id, documents.case_id), added UniqueConstraint targets, added cross-provenance regression test

## 2026-05-15 16:30 — [2706cb5] feat(facts): add consumer-credit fact and confirmation persistence contract
FINDINGS: 1 (0 critical, 0 high, 0 medium, 1 low)
ACTIONS: 1:accept (pre-existing alembic env issue)
DEFERRED: 0

## 2026-05-15 16:30 — PUSH main -> main
PR: —
CI: — (no CI configured)
PROMOTION: N/A
DEPLOYMENTS: P7 (added row to .kdbp/DEPLOYMENTS.md)

## 2026-05-18 12:48 — PHASE 1 EXECUTION STARTED

Started `/gabe-next` routed execution for Phase 1: Analysis contract and
persistence.

- PLAN: Phase 1 `Exec` marked `🔄`.
- Scope is contract/persistence only: analysis run, finding, evidence/citation,
  calculation, unsupported-output schemas, Alembic migration, architecture docs,
  and focused contract tests.
- Out of scope: deterministic calculation service, official reference catalog,
  agent orchestration, analysis API endpoints, and frontend source inspection.

## 2026-05-18 12:56 — PHASE 1 EXECUTION COMPLETE

Implemented Phase 1 analysis contract and persistence.

- Added SQLAlchemy models for versioned analysis runs, deterministic
  calculations, trusted findings, typed evidence/citations, and audit-only
  unsupported outputs.
- Added Alembic migration `20260518_0004` for the analysis contract tables and
  constraints.
- Added Pydantic schemas for `ConsumerCreditAnalysis`, analysis runs, findings,
  evidence anchors, calculation evidence, citations, inference metadata, and
  unsupported outputs.
- Added contract tests for supported finding boundaries, typed evidence anchors,
  analysis persistence, and database rejection of unsupported finding claims.
- Updated architecture docs with the analysis data model and contract boundary.
- PLAN: Phase 1 `Exec` marked `✅`; Review remains pending.

Verification:

- `uv run ruff check api/models/analysis.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `uv run ruff format --check api/models/analysis.py api/models/__init__.py api/schemas/analysis.py api/schemas/__init__.py api/migrations/versions/20260518_0004_create_analysis_contract.py tests/api/test_analysis_contract.py` — passed.
- `uv run pytest tests/api/test_analysis_contract.py -q` — passed, 4 tests.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-analysis-phase1-verify.db uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
- `uv run pytest -q` — passed, 55 tests.
- `uv run ruff check .` — passed.
- `npm test` — passed, 24 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- Note: `uv run ruff format --check .` still reports pre-existing untouched
  files that would be reformatted; changed files are format-clean.

## 2026-05-18 15:08 — PLAN UPDATED: Insert receptionist extraction gap gate

Inserted the reviewed multimodal receptionist gate before deterministic
discrepancy calculations.

- Added Phases 2-5 for receptionist schema/provider contract, media packing/run
  pipeline, deterministic gap comparison/resolution/promotion/readiness, and
  frontend gap review handoff.
- Shifted deterministic calculations, official references, structured analysis
  orchestration, and analysis API/UI to Phases 6-9.
- Added decision entries D17-D20 for the inserted phases.

## 2026-05-18 15:12 — PHASES 2-5 EXECUTION STARTED

Started implementation of the reviewed `DocumentReceptionistAgent` gate.

- Scope: receptionist audit persistence, Pydantic schemas, provider adapter,
  media packing, run service, deterministic comparator, gap resolution,
  promotion, composite readiness endpoint, Upload UI handoff, and focused tests.
- Out of scope: production provider routing, async workers, external
  observability, deterministic discrepancy calculations, official references,
  and `ConsumerCreditAgent` analysis.

## 2026-05-18 15:35 — PHASES 2-5 EXECUTION COMPLETE

Implemented the multimodal receptionist extraction gap gate.

- Added `DocumentReceptionistRun`, `DocumentReceptionistObservation`,
  `DocumentExtractionGap`, and `DocumentExtractionGapResolution` models plus
  Alembic migration `20260518_0005`.
- Added explicit `DocumentReceptionistAgent`, receptionist schemas, config,
  dependencies (`pydantic-ai`, `pymupdf`), bounded media packing,
  fake/provider-unavailable adapters, deterministic gap comparison, human
  resolution, promotion/correction behavior, and composite
  `analysis-readiness`.
- Added receptionist API endpoints for starting/reading runs, listing/resolving
  gaps, and reading composite readiness.
- Added `src/api/receptionist.ts` and Upload-screen receptionist run/gap review
  UI; continuation now uses composite readiness.
- Updated agent and architecture docs for the raw-document receptionist boundary.
- PLAN: Phases 2-5 `Exec` marked `✅`; Review remains pending.

Verification so far:

- `uv run python -m compileall api` — passed.
- `uv run pytest tests/api/test_receptionist_api.py tests/api/test_receptionist_media.py` — passed, 9 tests.
- `uv run ruff check api tests/api` — passed.
- `uv run ruff format --check api/agents api/config.py api/routes/receptionist.py api/services/receptionist.py api/services/receptionist_media.py api/services/receptionist_provider.py tests/api/test_receptionist_media.py` — passed.
- `DATABASE_URL=sqlite+pysqlite:////tmp/nmkgn-receptionist-verify.db uv run alembic -c api/migrations/alembic.ini upgrade head` — passed.
- `uv run pytest` — passed, 67 tests.
- `npm test -- --run tests/frontend/Upload.test.tsx` — passed, 15 tests.
- `npm test` — passed, 25 tests.
- `npm run lint` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## 2026-05-18 18:27 — RECEPTIONIST FAKE PROVIDER STABILIZED

Aligned the deterministic fake receptionist with the structural fact extraction
core so local gap reports no longer compare the improved extractor against an
outdated regex-only fake provider.

- Exposed a reusable non-persistent `build_consumer_credit_facts(...)` core from
  `api/services/fact_extraction.py`.
- Updated `FakeReceptionistProvider` to turn those transient structured facts
  into receptionist observations while still skipping deterministic warning
  placeholders.
- Kept unsupported-field signals in the fake provider as local audit-only
  observations.
- Added a regression API test proving a separated label/value block produces
  receptionist observations without `missing_in_receptionist` comparison noise.

Verification:

- `uv run pytest tests/api/test_receptionist_api.py -q` — passed, 6 tests.
- `uv run pytest tests/api/test_fact_extraction.py -q` — passed, 11 tests.
- `uv run pytest -q` — passed, 74 tests.
- `uv run ruff check api/services/fact_extraction.py api/services/receptionist_provider.py tests/api/test_receptionist_api.py` — passed.
- `uv run ruff format --check api/services/fact_extraction.py api/services/receptionist_provider.py tests/api/test_receptionist_api.py` — passed.
- `git diff --check` — passed.
- `uv run python manual-test-cases/run_catalog.py --case-id base-degradation-scotiabank-2022` — passed with run
  `manual-test-cases/runs/base-degradation-scotiabank-2022/20260518T222707Z`;
  gap count is now 8 with no `missing_in_receptionist` gaps, leaving one
  blocking `source_conflict` for `clause` plus seven advisory
  `unsupported_field` gaps.
- 2026-05-29 00:24 | Write | /home/khujta/projects/apps/nmkgn/api/services/draft.py
- 2026-05-29 00:25 | Write | /home/khujta/projects/apps/nmkgn/tests/api/test_draft.py
- 2026-05-29 00:30 | Edit | /home/khujta/projects/apps/nmkgn/docs/architecture.md
- 2026-05-29 00:41 | Edit | /home/khujta/projects/apps/nmkgn/api/services/draft.py
- 2026-05-29 00:41 | Edit | /home/khujta/projects/apps/nmkgn/api/services/draft.py
- 2026-05-29 00:55 | Write | /home/khujta/projects/apps/nmkgn/api/routes/export.py
- 2026-05-29 00:55 | Edit | /home/khujta/projects/apps/nmkgn/api/main.py
- 2026-05-29 00:55 | Edit | /home/khujta/projects/apps/nmkgn/api/main.py
- 2026-05-29 00:56 | Write | /home/khujta/projects/apps/nmkgn/src/api/export.ts
- 2026-05-29 00:57 | Write | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-29 00:57 | Edit | /home/khujta/projects/apps/nmkgn/api/routes/export.py
- 2026-05-29 01:01 | Edit | /home/khujta/projects/apps/nmkgn/docs/architecture.md
- 2026-05-29 01:01 | Edit | /home/khujta/projects/apps/nmkgn/docs/architecture.md
- 2026-05-29 01:10 | Write | /home/khujta/projects/apps/nmkgn/tests/e2e/test_export_draft.py
- 2026-05-29 01:12 | Edit | /home/khujta/projects/apps/nmkgn/tests/e2e/test_export_draft.py
- 2026-05-29 01:13 | Write | /home/khujta/projects/apps/nmkgn/tests/e2e/test_export_draft.py
- 2026-05-29 01:14 | Write | /home/khujta/projects/apps/nmkgn/tests/e2e/test_export_draft.py
- 2026-05-30 09:20 | Edit | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-30 09:20 | Edit | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-30 09:20 | Edit | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-30 09:26 | Edit | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-30 09:27 | Edit | /home/khujta/projects/apps/nmkgn/src/screens/Email.tsx
- 2026-05-30 09:30 | Edit | /home/khujta/projects/apps/nmkgn/tests/e2e/test_export_draft.py
