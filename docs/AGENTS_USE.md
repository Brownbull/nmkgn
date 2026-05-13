# Agent Documentation

<!-- Standards: see ~/.claude/skills/gabe-docs/SKILL.md (CommonMark + Mermaid + analogy-first) -->

## Agent Design

Each supported document type owns its own agent and Pydantic models.

V0 starts with:

- `ConsumerCreditAgent`
- `ConsumerCreditInput`
- `ConsumerCreditAnalysis`

The user-selected analysis plan controls which fields the UI shows. It must not
change the output schema requested from the agent.

## Tools

To define during implementation. Expected tool categories:

- document text lookup
- clause citation retrieval
- deterministic loan calculations
- benchmark lookup
- rule-source lookup

## Prompts

Prompts must be paired with schema enforcement. Prompt instructions alone are not
acceptable for structured output.

## Safety

The product should frame outputs as possible risks, inconsistencies, and points
to review unless a validated rule supports stronger language.

## Context Engineering

The agent should receive normalized document facts, user-provided comparison
context, selected benchmark/rule sources, and the analysis schema version.

## Output Contract

Every finding must include evidence. If evidence is incomplete, the finding must
carry uncertainty and ask for confirmation or missing context.
