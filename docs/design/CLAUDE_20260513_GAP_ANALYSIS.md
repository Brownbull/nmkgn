# Claude 2026-05-13 Case-Flow Gap Analysis

## Current App Baseline

Phase 1 is a persisted case-intake backbone:

- login uses a fixed demo identity
- case setup creates a PostgreSQL-backed `consumer_credit` case through FastAPI
- case setup captures stage, institution, optional amount, and optional expected
  term
- upload receives the persisted `caseId`
- upload locks non-credit document labels for persisted cases
- later detection, plan, coach, and email screens are still prototype/simulated
- real upload persistence, OCR, agents, provenance, and real auth are out of
  Phase 1

## Claude Design Coverage

The Claude export adds breadth and polish beyond the current app:

- richer login and first-run welcome/onboarding
- upload picker with a broader document-type catalog
- detection processing, high confidence, low confidence, unsupported, failed,
  and mixed-batch states
- persistent document-type badge and confidence indicator
- plan selection grouped by source: local law, market, uploaded comparisons,
  and international reference
- analysis-running screen with partial findings
- coach dashboard with impact summary, KPIs, market benchmark, action plan, and
  international context
- finding detail with clause text, methodology, alternatives, and email
  inclusion
- compare, email, share/re-analyze, history, settings, and mobile equivalents

## Main Gaps

### Case Setup

Claude flow does not include the persisted case setup screen that Phase 1 added.
The app must keep case setup before upload because the product is case-based:
one situation can hold multiple documents and comparisons.

Recommendation: insert the existing case setup step into the Claude case flow
instead of replacing it with the Claude upload-first flow.

### Document Type Scope

Claude design shows multiple document types. Phase 1 persistence is only
`consumer_credit`.

Recommendation: keep other document types visible only as future/disabled
reference options until backend agents and stable schemas exist for them.

### Detection States

Current app only has the basic simulated process/ready path. Claude adds low
confidence, unsupported, failed, and mixed-batch branches.

Recommendation: implement the detection state design in the prototype layer
first, behind explicit simulated-state controls, without claiming real OCR or
document detection.

### Plan and Coach

Current plan/coach screens are simpler than the Claude version. Claude provides
the strongest direction for explaining criteria, market comparison, action
questions, and evidence drill-down.

Recommendation: use the Claude plan and coach hierarchy as the next UI target,
but preserve the product-language boundary: analysis, possible risks, points to
review, and evidence. Avoid advisor language.

### Mobile

Claude has a complete mobile surface. The current app uses responsive layout
but does not have purpose-built mobile versions for every case-flow step.

Recommendation: use Claude mobile screens as responsive behavior references,
not separate app routes.

### Later Product Surfaces

Claude includes history, settings, share, compare, and email. Those are useful,
but they are not the next case-flow priority.

Recommendation: keep them in the backlog. The next implementation should not
build those full surfaces unless they directly support login, case setup, upload,
detection, plan, or coach.

## Recommended Next Implementation

Create a follow-up phase named "Case Flow UI Alignment from Claude Design".

Recommended in scope:

- align login and case setup with the selected `letra.` visual language
- add a persistent case/document context badge after case creation
- update upload to borrow Claude's layout while preserving persisted-case locks
  and prototype acknowledgement
- add prototype-only detection branches: ready, low confidence, unsupported, and
  failed
- align plan selection and running analysis with Claude's criteria hierarchy
- align coach dashboard with Claude's impact/KPI/benchmark/action-plan hierarchy
- add responsive checks for desktop and mobile widths

Recommended out of scope:

- real upload persistence
- OCR or document detection
- agent output schemas
- history/settings/share/email implementation
- unrestricted multi-document-type persistence
- direct copy of Claude JSX into `src/`

Acceptance for the next phase:

- the app still creates and uses a persisted `consumer_credit` case before
  upload
- unsupported document types cannot mutate persisted Phase 1 cases
- simulated analysis states remain visibly marked as prototype-only
- the case-flow screens work on desktop and mobile
- tests cover the case setup, upload guard, detection branch routing, and basic
  responsive rendering assumptions
