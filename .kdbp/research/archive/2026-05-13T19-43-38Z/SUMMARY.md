# Research Summary

Generated: 2026-05-12
Width: standard

## Executive Take

Proceed with the case-based architecture, but make the first supported case type
very narrow: Chilean consumer-credit contracts. The strongest product idea is not
"read any legal document". It is "turn one complicated consumer-credit situation
into structured facts, evidence-backed findings, and next actions".

The most important new scope decision from intake is that before-signing and
after-signing are both supported, but they are separate analysis paths controlled
by a required fixed field.

## Recommended Scope Posture

V0 should include:

- case setup with fixed fields
- required `case_stage` field: before signing or after signing
- upload of one primary consumer-credit document
- optional simulation/offer/comparator documents
- OCR and normalized document facts
- user confirmation for high-impact extracted fields
- stable `ConsumerCreditAnalysis` Pydantic output
- evidence-backed findings with fact/inference provenance
- before-signing market/reference comparison
- after-signing mismatch/recourse-oriented analysis
- bounded next actions and editable email/report drafts

V0 should exclude:

- free-form document analysis
- advisory claims
- marketplace behavior
- generalized legal-document coverage
- user-facing model/provider choice
- open-ended chat as the main analysis interface

## Success Criteria Seeds

These are not final SCs yet, but they should guide Step 5:

- A user can create a case and provide fixed context, including before/after
  signing, in under two minutes.
- A user can upload a consumer-credit contract and see extracted high-impact
  facts with source coordinates, extraction dates, and confirmation status.
- A user can identify whether the contract differs from an uploaded simulation,
  offer, or comparator loan.
- A user can see at least one path-appropriate analysis: market comparison before
  signing, or discrepancy/recourse analysis after signing.
- A user can export or draft communication based only on selected evidence-backed
  findings.

## Requirement Seeds

- Case intake schema with fixed fields.
- Document ingestion and OCR abstraction.
- Consumer-credit fact extraction model.
- Consumer-credit analysis model.
- Fact, inference, and unsupported-output provenance primitives.
- Citation and calculation evidence primitives with source coordinates,
  extraction/retrieval dates, verification dates, and trackable URLs for external
  references.
- Rule/reference source catalog for CMF/SERNAC/official law sources.
- Analysis-plan display configuration over a full stable output object.
- Progress events for long-running analysis.
- Observability for cost, latency, tokens, and extraction confidence.

## Risks

- Market comparison can mislead if presented as a personalized offer.
- OCR mistakes in payment count or rate can cause severe false findings.
- Legal language can drift into advice if UI copy is not constrained.
- A generic document architecture can erase the document-specific schemas the
  user wants.
- Official Chilean references need versioning and freshness tracking.
- AI-generated statements without model/date/source provenance can become
  hallucination candidates and must not be displayed as trusted findings.

## Source Highlights

- CMF recommends quoting and comparing before contracting financial products and
  calls out costs, benefits, needs, and payment capacity as relevant.
- CMF's credit-universal material supports comparability around final cost, CAE,
  commissions, associated expenses, and insurance.
- SERNAC lists financial-consumer rights around quote validity, total credit
  cost, CAE, summary sheets, charge breakdowns, bundled products, and information
  requests.
- PydanticAI supports structured agent output through `output_type`; BaseModel
  outputs are a better fit than dynamic schema outputs for v0.
- Google Document AI can provide OCR/text/layout extraction from PDFs/images and
  document quality features, but the product should hide provider choice behind
  an internal extraction interface.

## Research Files

- `.kdbp/research/domain.md`
- `.kdbp/research/pitfalls.md`
- `.kdbp/research/stack.md`
- `.kdbp/research/user-patterns.md`

## Sources

- CMF Educa, Credito de Consumo: https://www.cmfchile.cl/educa/621/w3-propertyvalue-43579.html
- CMF Educa, Credito Universal: https://www.cmfchile.cl/educa/621/w3-article-27421.html
- CMF Educa, Simuladores: https://www.cmfchile.cl/educa/621/w3-propertyvalue-44674.html
- CMF Educa, simulacion bancaria limits: https://www.cmfchile.cl/educa/621/w3-article-27362.html
- SERNAC, derechos del consumidor financiero: https://www.sernac.cl/portal/618/w3-propertyvalue-27777.html
- Ley Chile, Ley 19.496: https://nuevo.leychile.cl/navegar?idNorma=61438
- PydanticAI agents: https://pydantic.dev/docs/ai/core-concepts/agent/
- PydanticAI output: https://pydantic.dev/docs/ai/core-concepts/output/
- Google Document AI Enterprise OCR: https://cloud.google.com/document-ai/docs/enterprise-document-ocr
