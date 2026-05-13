# Claude Design Export Manifest

## Import

- Source: Claude design export for letra/nmkgn.
- Imported on: 2026-05-13.
- Location: `docs/design/incoming/claude-design-20260513/`.
- Status: curated reference material.
- Production status: not production code.

## Contents

HTML entry points:

- `letra. · Main flow.html`
- `letra. · Prototype.html`
- `letra. · Pitch.html`
- `wireframes.html`
- `Coach · Hi-fi explorations.html`

High-fidelity flow modules:

- `letra-app.jsx`
- `letra-proto.jsx`
- `letra-shared.jsx`
- `letra-flow.jsx`
- `letra-plan.jsx`
- `letra-coach.jsx`
- `letra-deep.jsx`
- `letra-other.jsx`
- `letra-extras.jsx`
- `letra-settings.jsx`
- `letra-mobile.jsx`
- `letra-mobile-extras.jsx`
- `letra-tweaks.jsx`
- `tweaks-panel.jsx`

Wireframe modules:

- `wf-app.jsx`
- `wf-shared.jsx`
- `wf-detection.jsx`
- `wf-plan.jsx`
- `wf-direction-a.jsx`
- `wf-direction-b.jsx`
- `wf-direction-c.jsx`
- `wf-direction-d.jsx`
- `wf-direction-d-extra.jsx`

Coach exploration modules:

- `coach-hifi-app.jsx`
- `coach-hifi-A.jsx`
- `coach-hifi-B.jsx`
- `coach-hifi-C.jsx`

Canvas/runtime helpers:

- `design-canvas.jsx`
- `deck-stage.js`
- `.design-canvas.state.json`

Assets:

- `scraps/` contains reference screenshots and the empty Napkin sketch export.
- `uploads/` contains the pasted uploaded design image used by the export.

## Cleanup

Removed from the curated import:

- `nmkgn.zip:Zone.Identifier` because it was Windows download metadata, not
  design source.

Future `*:Zone.Identifier` files are ignored by `.gitignore`.

## Preview

Optional static preview:

```bash
python3 -m http.server 15181 --bind 127.0.0.1 --directory docs/design/incoming/claude-design-20260513
```

Then open:

- `http://127.0.0.1:15181/letra.%20%C2%B7%20Main%20flow.html`
- `http://127.0.0.1:15181/wireframes.html`
- `http://127.0.0.1:15181/Coach%20%C2%B7%20Hi-fi%20explorations.html`

## Use Policy

- Treat these files as reference-only design material.
- Do not copy the JSX directly into `src/`.
- Any implementation must convert the relevant ideas into typed React/Vite app
  code, preserve the Phase 1 persisted case flow, and keep unsupported document
  types out of persisted Phase 1 cases.
