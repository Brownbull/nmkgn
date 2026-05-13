# Scaling

<!-- Standards: see ~/.claude/skills/gabe-docs/SKILL.md (CommonMark + Mermaid + analogy-first) -->

## Observability

Track at least these metrics per analysis run:

- total duration
- extraction duration
- analysis duration
- token input and output counts
- model cost
- document type confidence
- extraction warnings
- findings generated
- findings suppressed because of missing evidence
- user confirmations requested

## Reliability

The first reliability target is not throughput. It is repeatable, explainable
analysis for one supported document type.

## Data Retention

Define retention and deletion policy before accepting real user documents.
