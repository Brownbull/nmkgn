---
name: nmkgn
version: 1
status: active
created: 2026-05-12
last_scope_event: 2026-05-13
primary_user: People facing complex consumer-credit decisions while focused on the life event behind the contract
project_kind: agent-app
custom_sections: []
roadmap_file: .kdbp/ROADMAP.md
reference_frame_file: .kdbp/scope-references.yaml
---

# SCOPE — nmkgn

> **This is the stable backbone.** Changes to this document flow exclusively through `/gabe-scope-change` (which routes to `/gabe-scope-addition` or `/gabe-scope-pivot`). Direct edits are flagged by `/gabe-commit` audit.

## 0. Reference Frame {#reference-frame}

The following external documents framed this scoping. See `.kdbp/scope-references.yaml` for full entries.

| ID | Weight | Path | Role |
|---|---|---|---|
| ref-01 | authoritative | `docs/V0_ALIGNMENT.md` | V0 product boundary, evidence rules, and stable agent-schema contract |
| ref-02 | authoritative | `.kdbp/VALUES.md` | Project values that must govern scope and requirements |
| ref-03 | suggestive | `docs/AGENTS_USE.md` | Agent design and structured-output guidance |
| ref-04 | suggestive | `docs/architecture.md` | Initial system boundary, service boundaries, and data model framing |
| ref-05 | contextual | `docs/SCALING.md` | Observability and reliability considerations |
| ref-06 | contextual | `src/screens/` | Current Clo-designed mockup flow as UX reference, not final layout |

**Conflict resolution:** Authoritative refs are hard constraints; any deviation is recorded in the Change Log below. Downgrading an authoritative ref triggers a pivot.

## 1. One-liner {#one-liner}

A case-based app that turns Chilean consumer-credit documents into structured, evidence-backed facts, inferences, comparisons, and next steps.

## 2. Problem {#problem}

People often face complex contracts while their attention is on the life event behind the paperwork: building a house, getting financing, buying a service, or solving an urgent family need. That is exactly when details like payment count, total cost, linked products, rates, dates, and disclosure language are easiest to miss.

The first concrete pain is Chilean consumer credit. A loan can look better on paper because one rate or headline amount appears more favorable, while a hidden mismatch such as 60 payments versus 68 payments changes the real burden. Regular users rarely have the time, expertise, or energy to compare every clause, market reference, calculation, and official rule before signing.

The information needed to understand these cases exists, but it is fragmented across contracts, simulations, emails, bank documents, CMF/SERNAC materials, law text, and specialist knowledge. Existing help paths are uneven: users may rely on the provider, a narrow professional opinion, or generic document summarization that cannot guarantee stable fields, provenance, or evidence discipline.

The product gap is not legal or financial advice. The gap is a bounded analysis workflow that connects a user's actual case documents to structured facts, traceable sources, AI-labeled inferences, and clear points to ask, verify, compare, or escalate.

## 3. Vision / North Star {#vision}

In one to three years, nmkgn becomes a trusted analysis layer for complex document-backed decisions in Chile. A user can create one case, upload multiple related documents, choose whether they are before or after signing, and see the situation translated into stable document-specific analysis without losing source traceability.

The platform starts with Chilean consumer-credit contracts and proves the full loop: extract facts, preserve coordinates and dates, confirm high-impact fields, run deterministic checks and structured agents, separate facts from AI inferences, and suppress unsupported outputs from trusted findings.

As the system expands, each new document type gets its own fixed Pydantic input/output model and review posture. The platform remains case-based rather than free-form: it helps users compare options under one situation, understand what is known, see what is inferred, and decide what action they want to take outside the product.

## 4. Primary User & Jobs-to-be-Done {#primary-user}

**Primary user:** A person in Chile facing a consumer-credit contract decision while their attention is mostly on the life event behind the credit, not on contract analysis.

**Jobs-to-be-Done:**
- **When I** am about to sign a consumer-credit contract, **I want to** upload the contract and fixed case context, **so I can** see the key terms, risks, questions, and comparable references before I commit.
- **When I** already signed and something feels inconsistent, **I want to** compare the contract against simulations, offers, payments, or another loan, **so I can** understand what differs and what evidence supports asking for clarification.
- **When I** see a highlighted issue, **I want to** inspect whether it is a sourced fact, deterministic calculation, or AI inference, **so I can** trust the finding without treating the product as an advisor.

## 5. Secondary Users {#secondary-users}

- **Household co-decision maker** — A spouse, partner, or family member who shares the financial consequence and needs a common view of the case. Secondary because the workflow still starts from the primary user's documents and context.
- **Trusted helper** — A friend, relative, accountant, lawyer, or consumer-support professional who may review the exported evidence with the user. Secondary because the product prepares evidence-backed analysis, not a professional advisory workspace.
- **Future document-type owner** — A product or domain operator who defines a new fixed schema for another document class. Secondary because v0 proves consumer credit before expanding.

## 6. Non-Users {#non-users}

- **People seeking legal, financial, or accounting advice from the product** — The product can analyze documents and surface evidence, but it does not tell users what decision to make.
- **Users who want a free-form "analyze any document" tool** — The product requires document-specific schemas and bounded review plans; generic PDF summarization is out of scope.
- **Borrowers shopping for guaranteed personalized loan offers** — The product may show bounded market references before signing, but it is not a marketplace or broker.
- **Institutions seeking automated contract approval or compliance certification** — The product is designed for user understanding and evidence review, not for provider-side signoff.

## 7. Success Criteria {#success-criteria}

Goal-backward, observable user truths. Every criterion below is covered by >=1 Requirement in §12.

- **SC-01** {#sc-01} — A user can create a Chilean consumer-credit case with fixed context fields, including `case_stage`, in under two minutes.
  **Why:** The product must stay case-based and avoid open-ended intake as the primary workflow.
- **SC-02** {#sc-02} — A user can upload one primary consumer-credit document and optional comparison documents, then see extraction status and high-impact facts before analysis proceeds.
  **Why:** Users need to know what the system read before trusting any finding.
- **SC-03** {#sc-03} — A user can inspect every extracted high-impact fact with document coordinates, extraction date, provider metadata, and confidence where available.
  **Why:** Payment count, dates, rates, CAE, total cost, fees, and insurance fields can materially change the conclusion.
- **SC-04** {#sc-04} — A user can confirm or correct high-impact facts before those facts drive findings, with corrected values stored as user-confirmed facts.
  **Why:** OCR and extraction errors must not silently become analysis inputs.
- **SC-05** {#sc-05} — A user can inspect each finding's evidence trail as sourced facts, deterministic calculations, external references, or AI inferences with model/date/source metadata.
  **Why:** The product's trust boundary depends on separating fact, inference, and unsupported output.
- **SC-06** {#sc-06} — A user can complete a before-signing review that shows bounded market/reference comparisons and questions to ask without presenting personalized offers.
  **Why:** Market context matters most before signing, but the product must not become a broker or marketplace.
- **SC-07** {#sc-07} — A user can complete an after-signing review that identifies discrepancies against uploaded offers, simulations, payments, or comparator loans with supporting evidence.
  **Why:** The 60-versus-68-payment scenario requires an evidence-first discrepancy path after signing.
- **SC-08** {#sc-08} — A user can export or draft communication from selected evidence-backed findings while unsupported outputs are excluded from the user-facing result.
  **Why:** The product should help users ask, verify, or escalate without turning hallucination candidates into advice.

## 8. Non-Goals {#non-goals}

What we are explicitly NOT building, each paired with why.

### NG-01 — Professional advice {#ng-01}
**Statement:** We will not tell users what legal, financial, or accounting decision to make.
**Why:** The product is an analysis layer, not an advisor.

### NG-02 — Free-form analyzer {#ng-02}
**Statement:** We will not support generic "upload anything and ask anything" document analysis as the v0 workflow.
**Why:** Each supported document type needs a stable schema and bounded review plan.

### NG-03 — Dynamic agent outputs {#ng-03}
**Statement:** We will not ask agents to invent variable output structures per user or per document.
**Why:** The UI and audit trail depend on fixed Pydantic input/output models per document type.

### NG-04 — Marketplace or brokerage {#ng-04}
**Statement:** We will not provide guaranteed personalized loan offers or route users into provider transactions.
**Why:** Bounded comparisons can inform the user, but brokerage behavior changes the product, risk, and obligations.

### NG-05 — Broad legal-document coverage in v0 {#ng-05}
**Statement:** We will not cover leases, insurance, employment contracts, or other document classes until consumer credit works end to end.
**Why:** V0 proves one document class deeply before expanding.

### NG-06 — Provider-side certification {#ng-06}
**Statement:** We will not certify that a provider contract is lawful, compliant, or approved.
**Why:** The product is for user understanding and evidence review, not institutional signoff.

### NG-07 — Unsupported-output display {#ng-07}
**Statement:** We will not display unsupported AI output as a trusted finding.
**Why:** Ungrounded output can be stored for audit/debugging, but user-visible claims require fact or inference provenance.

## 9. Constraints {#constraints}

| Dimension | Constraint |
|---|---|
| Tech stack | Current frontend is React 19, TypeScript, and Vite. Backend is FastAPI. Primary database is PostgreSQL. Document agents should use stable Pydantic input/output models and a provider-neutral OCR/LLM interface. |
| Budget | No fixed monetary budget yet. Every analysis run must track cost, latency, token use, extraction confidence, and suppressed findings. |
| Timeline | No fixed external launch date. V0 should prove one Chilean consumer-credit case flow end to end before expansion. |
| Regulatory | Product language must stay in analysis territory, not legal, financial, or accounting advice. User-visible claims require provenance. Real user documents require retention, deletion, access-control, and audit policy before production use. |
| Team size | Small agent-assisted product team. Favor clear schemas, boring service boundaries, and testable workflows over infrastructure complexity. |
| Infra | Start as a web app with a FastAPI-backed analysis pipeline and PostgreSQL persistence. Long-running OCR and LLM work must report progress and persist run state. Sensitive documents must not be accepted in production until storage and retention policy are defined. |

## 10. Architecture Posture {#architecture-posture}

High-level shape only — detailed module design lives in per-phase PLAN.md files.

- **Synchrony:** Mixed. Case setup and fact confirmation are synchronous UI flows; OCR, extraction, analysis, benchmark lookup, and report generation are asynchronous jobs with progress events.
- **Topology:** Modular monolith first: React/Vite frontend, FastAPI backend, PostgreSQL persistence, and clear internal service boundaries for ingestion, extraction, confirmation, deterministic calculations, rule/reference lookup, document-specific agents, and report/draft generation.
- **Data gravity:** Hybrid. PostgreSQL is the source of truth for cases, document metadata, extracted facts, provenance records, confirmations, analysis runs, and audit state. Uploaded document binaries may use controlled file/object storage, referenced from PostgreSQL. OCR/LLM providers and official reference catalogs are external dependencies behind interfaces.
- **Deployment target:** Responsive web app plus FastAPI API and worker pipeline backed by PostgreSQL. The existing React/Vite screens are flow reference and prototype surface, not the final production boundary.
- **Integration surface:** PostgreSQL, OCR/document extraction provider, LLM/PydanticAI agent runtime, CMF/SERNAC/Ley Chile reference catalogs, controlled document storage, audit/provenance store, and export/email-draft generation.

## 12. Requirements {#requirements}

Each requirement covers one or more Success Criteria. Every requirement maps to exactly one Phase in [ROADMAP.md](ROADMAP.md).

### REQ-01 — Case intake and stage routing {#req-01}
**Covers SCs:** [SC-01](#sc-01)
**Description:** Provide a fixed-field case setup flow for Chilean consumer-credit review, including required `case_stage: before_signing | after_signing`, borrower/context fields, document-type selection, and analysis-plan selection.
**Acceptance signal:** A test user can create a valid case in under two minutes, and invalid or missing `case_stage` blocks analysis start.

### REQ-02 — Document upload and comparison registry {#req-02}
**Covers SCs:** [SC-02](#sc-02)
**Description:** Support upload of one primary consumer-credit document plus optional simulation, offer, payment, email, or comparator-loan documents under the same case.
**Acceptance signal:** A case can store and distinguish primary and comparison documents, with upload status and document metadata visible to the user.

### REQ-03 — OCR and normalized fact extraction {#req-03}
**Covers SCs:** [SC-02](#sc-02), [SC-03](#sc-03)
**Description:** Extract normalized consumer-credit facts from uploaded documents, including amount, currency, dates, term, payment count, installments, rates, CAE, total cost, fees, commissions, taxes, insurance, linked products, and relevant clauses.
**Acceptance signal:** Extracted high-impact facts are persisted with extraction status, source document id, page/coordinates or text span, extraction date, extraction provider, and confidence when available.

### REQ-04 — Provenance and claim classification {#req-04}
**Covers SCs:** [SC-03](#sc-03), [SC-05](#sc-05), [SC-08](#sc-08)
**Description:** Classify every user-visible claim as `fact`, `inference`, or `unsupported_output`, with required provenance fields for each trusted claim type.
**Acceptance signal:** Facts cannot be saved without source coordinates or a trackable URL plus dates, inferences cannot be saved without model/run/evidence metadata, and unsupported outputs are excluded from trusted findings.

### REQ-05 — High-impact fact confirmation {#req-05}
**Covers SCs:** [SC-04](#sc-04)
**Description:** Let users confirm or correct high-impact extracted facts before those facts drive findings, while preserving original extraction and user-confirmed values.
**Acceptance signal:** Findings that depend on unconfirmed high-impact fields are blocked or marked pending confirmation, and corrections are stored as user-confirmed facts with timestamp and actor.

### REQ-06 — Consumer-credit structured agent {#req-06}
**Covers SCs:** [SC-05](#sc-05)
**Description:** Implement `ConsumerCreditAgent` with stable Pydantic input/output models and explicit schema versions, producing the full `ConsumerCreditAnalysis` shape regardless of UI display configuration.
**Acceptance signal:** Golden tests verify the agent output schema is stable, versioned, and includes findings, evidence links, confidence, warnings, and next-action inputs.

### REQ-07 — Deterministic calculations and discrepancy checks {#req-07}
**Covers SCs:** [SC-05](#sc-05), [SC-07](#sc-07)
**Description:** Calculate and compare consumer-credit terms deterministically where possible, including payment-count mismatches, total amount paid, installment count, rate/CAE fields, fees, insurance, and differences against uploaded comparator documents.
**Acceptance signal:** The 60-versus-68-payment scenario produces a reproducible discrepancy finding backed by extracted facts and calculation evidence.

### REQ-08 — Official source and benchmark catalog {#req-08}
**Covers SCs:** [SC-05](#sc-05), [SC-06](#sc-06)
**Description:** Maintain a bounded reference catalog for CMF, SERNAC, Ley Chile, and market/reference comparisons used by the before-signing path.
**Acceptance signal:** External references store source URL, retrieval date, verification date when verified, and display labels that distinguish benchmarks from personalized offers.

### REQ-09 — Before-signing review path {#req-09}
**Covers SCs:** [SC-06](#sc-06)
**Description:** Provide a before-signing analysis path that highlights key terms, bounded market/reference comparisons, negotiation questions, missing information, and provider questions without presenting guaranteed offers.
**Acceptance signal:** A before-signing case produces at least one path-specific comparison or question set, with all claims backed by provenance.

### REQ-10 — After-signing discrepancy and recourse path {#req-10}
**Covers SCs:** [SC-07](#sc-07)
**Description:** Provide an after-signing analysis path that compares the signed contract against uploaded offers, simulations, payments, or comparator loans and organizes discrepancy evidence for clarification or escalation.
**Acceptance signal:** An after-signing case can show discrepancies, missing context, and relevant entities or information-request paths without advising the user what decision to make.

### REQ-11 — Finding presentation and source inspection {#req-11}
**Covers SCs:** [SC-03](#sc-03), [SC-05](#sc-05), [SC-08](#sc-08)
**Description:** Display findings with severity, confidence, claim type, source coordinates, calculations, external URLs, inference metadata, and uncertainty state in a responsive UI.
**Acceptance signal:** A user can open any finding and inspect the exact evidence trail, including fact/inference labels and omitted unsupported-output status.

### REQ-12 — Evidence-backed export and communication drafts {#req-12}
**Covers SCs:** [SC-08](#sc-08)
**Description:** Generate exportable summaries and editable communication drafts only from user-selected, evidence-backed findings.
**Acceptance signal:** Draft/export generation refuses unsupported outputs and includes source references or inference metadata for every included claim.

### REQ-13 — Run observability, audit, and retention guardrails {#req-13}
**Covers SCs:** [SC-02](#sc-02), [SC-03](#sc-03), [SC-05](#sc-05), [SC-08](#sc-08)
**Description:** Track analysis run state, progress, cost, token use, latency, extraction warnings, suppressed findings, source retrieval dates, user confirmations, and document retention/deletion status.
**Acceptance signal:** Each run has an auditable timeline and no production path accepts real user documents without defined retention, deletion, access-control, and audit behavior.

### Coverage matrix (auto-generated)

| Success Criterion | Covered by REQs |
|---|---|
| SC-01 | REQ-01 |
| SC-02 | REQ-02, REQ-03, REQ-13 |
| SC-03 | REQ-03, REQ-04, REQ-11, REQ-13 |
| SC-04 | REQ-05 |
| SC-05 | REQ-04, REQ-06, REQ-07, REQ-08, REQ-11, REQ-13 |
| SC-06 | REQ-08, REQ-09 |
| SC-07 | REQ-07, REQ-10 |
| SC-08 | REQ-04, REQ-11, REQ-12, REQ-13 |

Every SC must have >=1 REQ. Finalize blocks if the matrix is incomplete.

## 13. Strategic Risks {#strategic-risks}

Premise-level risks only. Implementation risks live in per-phase PLAN.md files.

### SR-01 — Advice boundary drift {#sr-01}
**Risk:** Product copy, generated drafts, or findings drift from analysis into legal, financial, or accounting advice.
**Likelihood:** Medium
**Severity:** High
**Mitigation posture:** Treat language boundaries as product requirements: every user-visible claim must be framed as analysis, evidence, uncertainty, question, or reference unless a validated rule supports stronger wording.

### SR-02 — False trust from extraction errors {#sr-02}
**Risk:** OCR or extraction mistakes in payment count, rate, CAE, dates, fees, or total cost produce misleading findings.
**Likelihood:** Medium
**Severity:** High
**Mitigation posture:** Require source coordinates, extraction metadata, confidence, and user confirmation before high-impact facts drive findings.

### SR-03 — Provenance gaps become hallucination leaks {#sr-03}
**Risk:** AI-generated statements without source, model, run, or evidence metadata appear as trusted analysis.
**Likelihood:** Medium
**Severity:** High
**Mitigation posture:** Classify every claim as fact, inference, or unsupported output; suppress unsupported output from findings and exports.

### SR-04 — Overbuilding beyond consumer credit {#sr-04}
**Risk:** Early work expands into generic legal-document analysis before the first consumer-credit flow proves the model.
**Likelihood:** Medium
**Severity:** Medium
**Mitigation posture:** Keep v1 requirements, roadmap phases, and acceptance signals tied to Chilean consumer credit until the end-to-end path is validated.

### SR-05 — Sensitive-document readiness gap {#sr-05}
**Risk:** Real contracts are accepted before retention, deletion, access-control, audit, and storage policies are implemented.
**Likelihood:** Medium
**Severity:** High
**Mitigation posture:** Block production use of real sensitive documents until the Phase 7 guardrails are complete.

## 14. Open Questions {#open-questions}

No open questions at v1 finalize.

## 15. Change Log {#change-log}

Append-only. Each entry: date, type (`init | addition | pivot | debt-scan`), summary, diff pointer (optional). `debt-scan` entries are written by `/gabe-debt` when it appends Open Questions to §14 and/or rules to `.kdbp/RULES.md`.

| Date | Type | Summary |
|---|---|---|
| 2026-05-13 | init | Initial scope authored via `/gabe-scope`; v0 focuses on Chilean consumer-credit document analysis with FastAPI, PostgreSQL, stable Pydantic document agents, and strict provenance. |
