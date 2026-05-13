# Entities

**Project:** nmkgn
**Last updated:** 2026-05-12

## Entities

| Entity | Description | Related REQs | Screens populated |
|--------|-------------|--------------|-------------------|
| Case | A user-created review workspace for one complicated situation | TBD | upload, plan, analysis |
| Document | Uploaded contract, simulation, offer, email, image, or supporting context | TBD | upload, detection |
| DocumentType | Supported analysis class such as consumer credit, lease, insurance, or employment contract | TBD | detection, plan |
| ConsumerCreditAnalysis | Stable structured output from `ConsumerCreditAgent` | TBD | plan, coach, email |
| Finding | Evidence-backed risk, inconsistency, or review point | TBD | running, coach, email |
| Citation | Clause, page, span, calculation, benchmark, or comparison input supporting a finding | TBD | coach, source inspection |
| AnalysisPlan | User-selected visibility and criteria set applied over the full stable analysis output | TBD | plan |
| NextAction | Practical action derived from findings, such as asking the bank a question | TBD | coach, email |

## Lifecycle invariants

- A finding cannot be promoted to user guidance without evidence.
- A document-specific agent cannot return a variable schema.
- A case can contain multiple documents, but v0 should prove consumer credit first.
- The analysis plan controls display and prioritization, not agent output shape.

## Relationships

- Case has many Documents.
- Document has one detected DocumentType.
- ConsumerCreditAnalysis belongs to one Case.
- ConsumerCreditAnalysis has many Findings.
- Finding has one or more Citations.
- Finding can produce zero or more NextActions.
