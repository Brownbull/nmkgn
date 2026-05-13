# Human Knowledge Map

Tracks what the human operator understands about decisions made. Populated by
`/gabe-teach`.

## Root artifacts

- [`.kdbp/SCOPE.md`](SCOPE.md) — project premise (stable backbone, changed via `/gabe-scope-change`)
- [`.kdbp/ROADMAP.md`](ROADMAP.md) — phase plan (updated on any `-change`; read by `/gabe-plan`)

## Gravity Wells

**Status: uninitialized.** Run `/gabe-teach init-wells` to define architectural
sections before the first teach session.

| # | Name | Description | Analogy | Paths | Docs | Topics (verified / pending / total) |
|---|------|-------------|---------|-------|------|--------------------------------------|

## Topic Classes

| Class | Question it answers | Source |
|-------|--------------------|--------|
| WHY | Why did we choose this approach? | commits, PLAN.md, DECISIONS.md |
| WHEN | When should this pattern apply or not apply? | repeated patterns across commits |
| WHERE | Why does this file live here? | new files and structure conventions |

## Status Lifecycle

| Status | Meaning | Re-surfaces? |
|--------|---------|--------------|
| pending | Detected from changes, not yet discussed | Yes |
| verified | Human answered correctly | No, unless stale |
| skipped | Human deferred this session | Yes |
| already-known | Human claimed prior knowledge | No |
| stale | Verified more than 90 days ago | Yes |

## Topics

| # | Well | Class | Topic | Status | Tags | ArchConcepts | Last Touched | Verified Date | Score | Source |
|---|------|-------|-------|--------|------|--------------|--------------|---------------|-------|--------|

## Sessions

No `/gabe-teach` sessions yet.

## Storyline

No storyline generated yet. Run `/gabe-teach story` after a few completed phases.
