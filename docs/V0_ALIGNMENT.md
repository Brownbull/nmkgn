# V0 Alignment

## Product Slice

Build the first version around Chilean consumer-credit review.

The product should help a person create a case, upload a loan or credit document,
confirm the extracted facts, run a structured analysis, and leave with evidence-
backed risks plus practical next actions.

V0 is not a general legal-document analyzer. Other document types can appear as
future product directions, but the first implementation should prove the
consumer-credit case end to end.

## Core User Story

A user uploads a Chilean consumer-credit contract and optional context, such as a
simulation, initial offer, email from the bank, or a second comparable loan. The
system extracts the important terms, compares them against the selected review
plan, highlights risks, cites the supporting clauses or calculations, and helps
the user decide what to ask, negotiate, or verify next.

## Agent Contract

Each supported document type owns its own structured agent.

Agents must not emit variable output shapes. For a given document type, the input
and output schemas are stable Pydantic models. The values can vary by case, but
the fields must be predictable.

This means:

- `ConsumerCreditAgent` returns a `ConsumerCreditAnalysis`.
- Future `LeaseAgent`, `InsuranceAgent`, or `EmploymentContractAgent` equivalents
  return their own document-specific analysis models.
- Shared structures are allowed for common concepts such as case metadata,
  source citations, confidence, extracted party data, money values, dates,
  warnings, and next actions.
- Document-specific structures stay document-specific. Consumer-credit analysis
  should not force lease, insurance, or employment fields into generic buckets.
- The UI chooses which fields to show based on the user's selected analysis plan.
  The agent still generates the full stable analysis shape for that document
  type.

## V0 Consumer-Credit Output Shape

The initial consumer-credit schema should cover at least:

- case metadata and document identity
- extracted parties and institution names
- principal amount, currency, dates, term, payment count, and installment details
- rates, CAE, total cost, fees, commissions, taxes, and insurance costs
- linked or bundled products
- prepayment, default, late-payment, and acceleration clauses
- comparison inputs, such as simulation terms or another uploaded loan
- Chilean legal/disclosure checks
- market benchmark checks
- clause-level citations and calculation evidence
- confidence and extraction warnings
- prioritized findings
- recommended next actions
- generated communication draft inputs

## Evidence Rule

Every user-visible claim must be classified as one of:

- `fact`: a value from an uploaded document or external source
- `inference`: an AI-generated conclusion from known facts and sources
- `unsupported_output`: an ungrounded output kept only for audit/debugging

Every fact must include provenance:

- uploaded document facts need document id, page, source coordinates or text
  span, extraction date, extraction provider, and confidence when available
- external facts need a trackable source URL, retrieval date, and verification
  date when verified

Every inference must be explicitly marked as inference and include model, schema
version, run id, generated date, and the facts or sources it used.

Every finding must then be grounded in at least one of:

- a cited document span or clause
- a deterministic calculation from extracted fields
- a selected benchmark or rule source
- an explicit user-provided comparison input

If the evidence is incomplete, the finding should be marked as uncertain and the
UI should ask the user to confirm or upload missing context.

If a claim cannot be tied to a fact or inference trail, store it as
`unsupported_output` or a hallucination candidate. Do not present it as an
analysis result.

## Product Language Boundary

Use careful language by default:

- "possible risk"
- "inconsistency"
- "point to review"
- "worth asking about"
- "needs confirmation"

Avoid definitive legal conclusions unless the finding is backed by a specific
validated rule and the product clearly explains the evidence.

## UX Structure From Current Mockups

Keep the current mockup flow as the starting structure, with Phase 1 narrowing
the active path to persisted case intake and Phase 4 replacing the upload
handoff with real document persistence:

1. login with the fixed demo identity
2. case setup with fixed lean fields and required stage selection
3. persisted consumer-credit case creation
4. document upload, status display, and extracted-text preview using the
   returned `caseId`
5. simulated analysis acknowledgement before entering later prototype screens
6. findings by perspective
7. next actions
8. export, compare, or draft communication

The mockups are not final implementation quality. The real app still needs
responsive layout work, accessible controls, source inspection, and state/error
handling.

Phase 1 keeps persisted cases limited to `consumer_credit`. Other document-type
labels may remain visible as future options, but they must not mutate a persisted
case into an unsupported document type.

Phase 4 lets persisted cases upload primary and comparison documents, but it
does not turn extracted text into confirmed facts, analysis, or findings. The UI
must keep OCR-pending, failed extraction, and later prototype analysis visibly
separate from real document storage.

## Implementation Implications

- The backend should route by document type to a known agent and schema.
- Schema versions should be explicit.
- Parsed document facts should be stored separately from generated analysis.
- UI field visibility should be configuration over a stable analysis object, not
  a reason to ask the model for a different shape.
- Tests should include golden cases for the consumer-credit schema, especially
  the 60 vs 68 payment mismatch scenario.
