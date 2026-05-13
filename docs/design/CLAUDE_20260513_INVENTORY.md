# Claude 2026-05-13 Design Inventory

## Summary

The imported package is a full Claude design export for the letra/nmkgn product.
It contains static HTML canvases, global-window JSX prototypes, wireframes,
coach-dashboard explorations, mobile variants, and screenshot assets. It is
valuable as product and visual reference, but it is not app-ready source code.

Reference root:

`docs/design/incoming/claude-design-20260513/`

## Entry Points

| File | Purpose |
|---|---|
| `letra. · Main flow.html` | High-fidelity multi-screen design canvas for the chosen product flow. |
| `letra. · Prototype.html` | Interactive high-fidelity prototype route map. |
| `letra. · Pitch.html` | Pitch/deck surface with presentation assets. |
| `wireframes.html` | Earlier wireframe study with alternatives A/B/C/D and direction D selected. |
| `Coach · Hi-fi explorations.html` | Three visual explorations for the coach dashboard. |

## High-Fidelity Main Flow

The main flow is wired through `letra-app.jsx` and uses the `LT_*` screen family.
It covers:

- login
- welcome/onboarding
- upload
- detection processing
- detection ready
- detection low confidence
- unsupported document type
- read/analysis failure
- plan selection
- analysis running
- coach dashboard
- finding detail
- share and re-analyze
- compare two offers
- email to the bank
- document history and empty history
- settings
- mobile equivalents for the same broad flow

Core modules:

- `letra-shared.jsx` defines the design primitives, app shell, doc badge, icons,
  step indicator, avatar menu, and shared cards.
- `letra-flow.jsx` covers login, upload, and detection states.
- `letra-plan.jsx` covers plan selection and running analysis.
- `letra-coach.jsx` covers the main coach dashboard.
- `letra-deep.jsx` covers finding detail, evidence/methodology, share, and
  re-analyze ideas.
- `letra-other.jsx` covers compare, email, and history.
- `letra-extras.jsx` covers onboarding, empty history, and failure states.
- `letra-settings.jsx` covers account/settings surfaces.
- `letra-mobile.jsx` and `letra-mobile-extras.jsx` cover responsive mobile
  versions.
- `letra-proto.jsx` defines the prototype state machine.

## Wireframe Study

The wireframe set is wired through `wf-app.jsx`.

It frames direction D, "Coach + comparacion", as the chosen direction, while
keeping A/B/C as reference alternatives:

- A: report-first analysis
- B: annotated document/detail view
- C: conversational picker
- D: coach dashboard, market benchmark, plan of action, compare offers, email,
  and history

Notable reusable ideas:

- document-type identification as a persistent signal
- confidence states for detection
- unsupported-type handling
- mixed-batch handling
- plan criteria grouped by source
- mobile detection and coach layouts

## Coach Dashboard Explorations

The coach exploration package compares three visual directions:

- A: editorial/notarial style
- B: calm fintech style, closest to the selected `letra.` language
- C: data-precise archival style

The current high-fidelity main flow uses the calm fintech direction: warm paper,
deep teal accent, restrained severity colors, compact cards, and tabular numeric
presentation.

## Assets

`scraps/` includes reference screenshots:

- pitch cover variations
- coach pitch image
- detection/welcome/check states
- mobile coach reference
- empty/failed/low/welcome state checks
- an empty Napkin sketch JSON export

`uploads/` includes the pasted source image used by the design export.

## Technical Shape

The design export is not directly compatible with the app source:

- It uses React 18 UMD scripts and Babel in HTML.
- Components are global functions assigned to `window`.
- Styling is mostly inline and global CSS in HTML files.
- It is JavaScript/JSX, not typed TypeScript/TSX.
- It contains prototype-only state machines and simulated data.

Implementation should extract product decisions and visual patterns, then rebuild
them inside the app's React/Vite/TypeScript structure.
