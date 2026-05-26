# Agent Documentation

<!-- Standards: see ~/.claude/skills/gabe-docs/SKILL.md (CommonMark + Mermaid + analogy-first) -->

## Agent Design

Each supported document type owns its own agent and Pydantic models.

V0 starts with:

- `DocumentReceptionistAgent`
- `ConsumerCreditAgent`
- `ConsumerCreditInput`
- `ConsumerCreditAnalysis`

The user-selected analysis plan controls which fields the UI shows. It must not
change the output schema requested from the agent.

`DocumentReceptionistAgent` is the pre-analysis receptionist: it may receive
original document media, extracted text, document metadata, and the supported
consumer-credit fact schema. It returns structured observations only. It does
not receive deterministic fact values, write facts directly, resolve gaps,
calculate discrepancies, or produce legal findings.

Receptionist observations remain audit records until the deterministic
comparator creates gaps and a human resolves them. Accepted missing known facts
are promoted by the backend service with
`extraction_provider="receptionist-agent-v1"` and a confirmation record.
Accepted conflicts correct an existing fact through a confirmation record.
Unsupported fields remain backlog/audit evidence.

## Tools

To define during implementation. Expected tool categories:

- document text lookup
- clause citation retrieval
- deterministic loan calculations
- benchmark lookup
- rule-source lookup

The receptionist media boundary is narrower than general document lookup:
plain text uses extracted text segments, image uploads pass as image media, and
PDFs are rendered to a bounded number of page images. Provider failures,
partial coverage, and unanchored high-impact claims block composite analysis
readiness.

The document text lookup boundary should read persisted extracted text segments,
not uploaded file bytes directly. Extracted text segments identify their source
document, page or span, provider, extraction date, confidence when known, and any
warning state. They are source material for later normalized facts, not findings
by themselves.

## Prompts

Prompts must be paired with schema enforcement. Prompt instructions alone are not
acceptable for structured output.

## Safety

The product should frame outputs as possible risks, inconsistencies, and points
to review unless a validated rule supports stronger language.

## Context Engineering

The agent should receive normalized document facts, user-provided comparison
context, selected benchmark/rule sources, and the analysis schema version.
Uploaded documents and extracted text feed that normalization pipeline, but the
agent should not infer trusted findings from raw extracted text without a
provenance and confirmation path.

`ConsumerCreditAgent` must not receive raw uploaded documents. Its inputs are
confirmed/corrected/rejected fact packets, deterministic calculations, selected
official references, and the analysis schema version. Raw document access is
reserved for `DocumentReceptionistAgent` and is still non-authoritative until
human gap resolution.

### ConsumerCreditAgent Implementation

`ConsumerCreditAgent` delegates to a `ConsumerCreditProvider` protocol via
`get_consumer_credit_provider(settings)`. The provider receives a
`ConsumerCreditAgentInput` (analysis run ID, case ID, confirmed fact IDs,
calculation results, and active reference keys) and returns a
`ConsumerCreditProviderResult` containing a full `ConsumerCreditAnalysis` with
findings, evidence, inference metadata, and run metrics.

Provider implementations:

- `FakeConsumerCreditProvider` — deterministic fake that builds findings from
  calculation discrepancies. Used for local development and testing.
- `TimeoutConsumerCreditProvider` — always raises a timeout error. Used for
  failure-path testing.
- `UnavailableConsumerCreditProvider` — raised for unknown provider names.
  Fail-closed by design.

`run_agent_analysis()` in `api/services/analysis.py` orchestrates the full
agent flow: readiness gating, fact loading, deterministic calculations,
provider invocation, finding/evidence/unsupported-output persistence, and
run metric recording. Provider failures are caught and recorded as
`status="failed"` with the error detail.

## Output Contract

Every finding must include evidence. If evidence is incomplete, the finding must
carry uncertainty and ask for confirmation or missing context.
