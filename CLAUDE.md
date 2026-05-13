# nmkgn

Chilean consumer-credit case reviewer for detecting contract inconsistencies,
risky loan terms, and practical next actions.

<!-- KDBP-MARKER: gabe-init v1 -->

## KDBP Active

This project uses **KDBP (Khujta Database Protocol)** - structured project memory
under `.kdbp/` that every Claude Code session reads. KDBP gives context, plans,
values, knowledge, decisions, and quality gates a durable home outside the
session window.

Maturity: **mvp** - Stack: react, typescript, vite, python, fastapi, pydantic,
pydantic-ai, llm-agents

### What to read when

| Moment | File | Why |
|--------|------|-----|
| Session start | `.kdbp/BEHAVIOR.md` | Project identity, maturity, tech stack |
| Before decisions | `.kdbp/VALUES.md` + `~/.kdbp/VALUES.md` | Project + user values override defaults |
| Before implementing | `.kdbp/PLAN.md` | Active phase, task status, tier constraints |
| Before architectural changes | `.kdbp/DECISIONS.md` | Prior decisions + rationale |
| Before creating files | `.kdbp/STRUCTURE.md` | Folder conventions |
| Before editing source | `.kdbp/DOCS.md` | Source to doc drift mappings |
| Explaining concepts | `.kdbp/KNOWLEDGE.md` | Gravity wells + verified topics |
| Pre-commit | `.kdbp/PENDING.md` | Deferred review findings + escalation |
| Incident / audit | `.kdbp/LEDGER.md` | Checkpoint + commit + review history |

### Active commands

| Command | When to use |
|---------|-------------|
| `/gabe-help` | Context-aware "what should I do next?" |
| `/gabe-plan` | Create or view the active plan |
| `/gabe-next` | Router for the next phase step |
| `/gabe-execute` | Implement current phase tasks |
| `/gabe-mockup` | Refine mockup or UI-discovery phases |
| `/gabe-review` | Risk-priced code review with triage + confidence |
| `/gabe-commit` | Commit quality gate |
| `/gabe-push` | Push + PR + CI watch |
| `/gabe-teach` | Consolidate architect-level understanding post-commit |

### Invariants

1. **Consumer credit first.** Do not expand v0 beyond Chilean consumer-credit
   review until that path works end to end.
2. **Stable agent schemas.** Each document type has fixed Pydantic input/output
   models. UI display options never change the agent output shape.
3. **Evidence before advice.** Findings must cite a clause, calculation,
   benchmark, or user-provided comparison.
4. **PLAN before code.** Check `.kdbp/PLAN.md` phase state before implementing.
5. **STRUCTURE before placement.** New files should match `.kdbp/STRUCTURE.md`.
6. **VALUES override defaults.** Project `.kdbp/VALUES.md` and user
   `~/.kdbp/VALUES.md` outrank model priors.

### Full reference

- Project alignment - `docs/V0_ALIGNMENT.md`
- Agent docs - `docs/AGENTS_USE.md`
- Architecture docs - `docs/architecture.md`
- Suite skills - `~/.claude/skills/gabe-*/SKILL.md`
- Suite commands - `~/.claude/commands/gabe-*.md`
- User values - `~/.kdbp/VALUES.md`

<!-- Content above this line is managed by /gabe-init and refreshed by `update` mode. -->
<!-- Add project-specific instructions for Claude Code below. -->
