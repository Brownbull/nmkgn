---
name: nmkgn
domain: Chilean consumer-credit case reviewer for detecting contract inconsistencies, risky loan terms, and practical next actions.
maturity: mvp
tech: react, typescript, vite, python, fastapi, pydantic, pydantic-ai, llm-agents
project_type: hybrid
created: 2026-05-12
---

# Project Behavior Rules

This project is a hybrid MVP. The current React screens are mockup-grade product
evidence, and the target product is an agent-backed web application.

The first production slice is Chilean consumer-credit review. Do not frame the
MVP as a general legal-document analyzer. Future document types should be
supported through their own document-specific agents and schemas.

Read [docs/V0_ALIGNMENT.md](../docs/V0_ALIGNMENT.md) before creating a plan,
agent schema, data model, or user-facing finding surface.

## B1 - Inventory before proposing

**Trigger phrases:** "can we work on", "should we", "I'm wondering", "explore
the possibility", "what do you think about", "how can we approach", "is it
possible to". Treat these as diagnose-prompts, not build-prompts.

**Mandatory inventory before any proposal:**

1. Read existing project state: `.kdbp/PLAN.md`, `.kdbp/VALUES.md`,
   `.kdbp/STRUCTURE.md`, `.kdbp/DOCS.md`, and `docs/V0_ALIGNMENT.md`.
2. Inspect the current React mockup flow under `src/screens/`.
3. If the work touches agents, inspect `docs/AGENTS_USE.md` and the relevant
   Pydantic schema files once they exist.
4. List what already exists before proposing what is missing.

**Self-check before delivery:** Did I read existing state? Did I preserve the
consumer-credit v0 boundary? Did I keep the agent output shape stable?

## B2 - Stable document agents

Each supported document type owns a stable Pydantic input and output contract.
The model may fill different values per case, but it must not invent or omit
schema fields based on the user's analysis plan.

## B3 - Evidence-first findings

A finding is not product-ready unless it is grounded in a clause, document span,
deterministic calculation, selected benchmark, or explicit user-provided
comparison input.

## B4 - Careful product language

Default to "possible risk", "inconsistency", "point to review", and "needs
confirmation". Avoid definitive legal conclusions unless a validated rule and
evidence path support the claim.
