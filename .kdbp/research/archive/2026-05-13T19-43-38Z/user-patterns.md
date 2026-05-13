# User Patterns Research

Generated: 2026-05-12

## Scope

Standard `/gabe-scope` research lane: user patterns. Focused on the product flow
and interaction model implied by the user interviews, reference frame, and
current mockups.

## Patterns

### 1. Case first, document second

The user is not just uploading a PDF. They are in a situation. The case should
capture fixed fields before analysis:

- case stage: before signing or after signing
- document type
- country/jurisdiction
- product class
- provider/institution
- primary goal
- optional comparison documents
- optional simulation or initial offer

Free-form context can exist later as notes, but v0 scope should rely on fixed
fields.

### 2. Path-specific analysis

Before signing:

- compare against market/reference options
- identify negotiation questions
- flag missing disclosure or confusing terms
- summarize what to confirm before committing

After signing:

- compare contract vs simulation/offer
- identify mismatches and evidence
- produce questions or information requests
- show escalation entities and documentation needed

### 3. Evidence cards

Findings should not be free-floating summaries. Each card should include:

- title
- severity or confidence
- source citation
- extracted value
- expected/comparison value when available
- why it matters
- next action or question
- before/after path relevance

### 4. User confirmation checkpoints

High-impact fields should be confirmable before the app treats them as final:

- principal amount
- number of payments
- payment amount
- rate and CAE
- total cost
- dates
- provider name
- insurance or bundled products

### 5. Limited choices, not infinite browsing

The user asked for one to five options, ideally no more than three. This supports
a bounded "reference alternatives" panel rather than a marketplace, search
engine, or lead-generation product.

### 6. Current mockup flow is directionally good

The screens already express the right high-level journey:

1. upload
2. identify document
3. choose/review analysis plan
4. show progress
5. show findings by perspective
6. generate next action or email

The production version needs responsive layout, source inspection, error states,
field confirmation, and path-specific before/after behavior.

## Sources

- Current mockups: `src/screens/Login.tsx`, `src/screens/Upload.tsx`, `src/screens/Detection.tsx`, `src/screens/Plan.tsx`, `src/screens/Coach.tsx`, `src/screens/Email.tsx`
- Project reference frame: `docs/V0_ALIGNMENT.md`, `.kdbp/VALUES.md`
- SERNAC financial-consumer rights: https://www.sernac.cl/portal/618/w3-propertyvalue-27777.html
