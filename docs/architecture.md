# Architecture

<!-- Standards: see ~/.claude/skills/gabe-docs/SKILL.md (CommonMark + Mermaid + analogy-first) -->

## System Boundary

V0 is a Chilean consumer-credit case reviewer, not a broad legal-document
analyzer. See [V0_ALIGNMENT.md](V0_ALIGNMENT.md) for the product and evidence
rules.

## Committed Stack

- Frontend: React, TypeScript, and Vite.
- Backend: FastAPI.
- Database: PostgreSQL.
- OCR and LLM providers remain behind internal interfaces.

## Data Model

Initial domain objects:

- Case
- Document
- DocumentType
- ExtractedFact
- ProvenanceRecord
- UserConfirmation
- AnalysisRun
- ConsumerCreditAnalysis
- Finding
- Citation
- AnalysisPlan
- NextAction

## API Contracts

The central contract is document-type-specific structured output:

- `ConsumerCreditAgent` returns `ConsumerCreditAnalysis`.
- Future document agents return their own stable analysis models.
- Shared primitives can cover money, dates, source citations, confidence,
  warnings, and next actions.

## API Endpoints

FastAPI endpoints are defined during the first implementation plan.

## Services

Expected service boundaries:

- document ingestion and OCR/extraction
- document type detection
- normalized fact confirmation
- document-specific agent analysis
- deterministic calculations
- benchmark and rule-source lookup
- report and email draft generation

## Frontend Structure

Current mockup screens live under `src/screens/` and should be treated as product
flow guidance, not final production implementation.

## Integrations

PostgreSQL is required for application persistence. OCR, LLM provider, document
storage, and benchmark/reference-source strategy are defined behind interfaces
during implementation planning.
