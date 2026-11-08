# Toolcraft App Agent Worklog

## Status

Mode: product

Active change: shelf-motion-lab-initial

## Decision Trail

### Change ID: shelf-motion-lab-initial

- Request: "I need you to create an animation tool for me to control how book animates. More like ehen user add book to shelve, that confirmation feel to it. Lean towards 3d." followed by "rebuilt using toolcraft".
- Task type: first product delivery (app assembly, schema/controls, renderer, timeline, export).
- User-visible result: A 3D bookshelf (Three.js) where a book is picked up, flown in an arc, turned spine-out and dropped into its slot, with impact squash, neighbours leaning away, a shelf dip and a warm landing glow. The sequence plays on the Toolcraft playback timeline and every beat is tunable from the panel.
- Source/reference checked: the earlier Next.js prototype at `/lab/shelf` in the portfolio repo (same motion beats and default values); local Toolcraft docs and the generated starter.
- Reference inputs: None. No motion reference or design file was supplied.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/timeline-animation.md`, `core/setup-export.md`, `renderer-technique.md`, `schema-reference.md`, `component-rules.md`, `decision-contract.md`, `acceptance-testing.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui` (the earlier prototype's toast and buttons were dropped from the canvas), `renderer-view-interaction` (orbit with an orientation gizmo), `timeline-mode-choice` (playback timeline), `output-export-required` (image default only), `controls-section-inventory-required`, `persistence-policy-explicit` (default local persistence).
- View interaction intent: `orbit`, target `shelf.view`. The scene is a visible editable 3D scene and the user gave no instruction to lock the camera, so no fixed-camera authority exists.
- Interaction ownership: camera orbit on the canvas (gizmo plus direct drag on the shelf, rejected panel angle sliders); viewport pan and zoom on the canvas; every motion setting in the panel as precise value entry.
- Decision: Three.js WebGL renderer in `scene.canvasContent`; the sequence is a pure function of loop time and settings (`src/app/shelf/motion-sequence.ts`) so playback, scrubbing and PNG export sample identical frames; springs use a closed-form damped step response so they are deterministic when scrubbed.
- Alternatives rejected: CSS 3D (no shadows, cannot be rasterized by runtime image export); wall-clock Motion springs (not scrubbable, would drift from the timeline); a click-to-add interaction (the timeline already replays the add on every loop, and canvas buttons are app UI).
- State/output mapping: Pick Up, Flight and Landing sliders feed `readShelfMotionConfig` → `evaluateShelfSequence` → `ShelfScene.apply`; `shelf.insert` picks the landing slot; `confirmation.glow`/`glowColor` drive the glow disc and point light; `shelf.view` sets the camera; the timeline time is wrapped with `getToolcraftTimelineLoopTime`; export uses the same functions in `shelfExportRenderer`.
- Verification: see Verification below.
- Risks: see Risks below.

## Decisions

### Renderer

- Decision: Three.js WebGL (`provider: "three"`) for preview and export, with one retained `scene-resources` pass, a per-frame `preview-render` pass and a batch `export-render` pass.
- Reason: lit, shadowed 3D books need real perspective shading; Three.js is already a starter dependency.
- Evidence: `src/app/shelf/shelf-pipeline.ts`, `src/app/app-performance.ts`.

### View Interaction

- Decision: `orbit` with one `orientationGizmo` at `shelf.view` in the Shelf section; direct drag on any shelf mesh orbits via `useToolcraftModelOrbitInteraction` with a raycast hit test.
- Reason: a visible editable 3D scene defaults to orbit; no verbatim request or behavioural reference locks the camera.
- Evidence: `src/app/shelf/shelf-canvas.tsx`, `src/app/shelf/motion-schema-sections.ts`.

### Interaction Ownership

- Decision: canvas owns camera orbit, pan and zoom; the panel owns all motion settings.
- Reason: spatial operations keep feedback on the scene; timing values need exact entry.
- Evidence: `appProductReadiness.interactionOwnership` in `src/app/app-acceptance-data.ts`.

### Timeline

- Decision: playback timeline, default loop 3.2 s. The loop starts with an empty stand and ends with the added book faded out and the gap closed, so first and last frames match. If the tuned sequence is longer than the loop, all beats compress proportionally.
- Reason: product animation uses the top playback timeline; scrubbing is the main way to inspect a beat.
- Evidence: `getShelfSequenceTiming` in `src/app/shelf/motion-sequence.ts`.

### Layers

- Decision: no Layers module.
- Reason: no layer workflow was requested.
- Evidence: `src/app/app-schema.ts` modules list.

### Controls

- Decision: sections Shelf, Pick Up, Flight, Landing, Confirmation and the Background source pair. Sliders are continuous except Extra spins (discrete, 0–3).
- Reason: sections follow the beats of the add-to-shelf sequence, each with its own reset scope.
- Evidence: `src/app/shelf/motion-schema-sections.ts`, `src/app/app-control-inventory.ts`.

### Export

- Decision: image export only (`toolcraft-default`); SVG and video not requested.
- Reason: the user asked for no artifact; animation or a timeline does not imply video.
- Evidence: `appProductReadiness.exportIntent`.

### Performance

- Decision: no workload controls (`workloadEnvelope.dimensions: []`); render scale enabled with the canonical 1–2 range.
- Reason: scene geometry is fixed (ten books, one shelf); only backing pixels scale with render scale and canvas size.
- Evidence: `src/app/app-performance.ts`. No measured performance was run.

Canonical control values and selected-entity isolation must follow runtime representations and the declared selection owner. Render-scale-enabled products record functional `renderScaleCoverage`; prose never substitutes for asserted backing-quality proof.

## Evidence

- Source reviewed: generated Toolcraft starter, the signed runtime public API and the `vgpu-physical-feedback` e2e fixture as a current-API pattern.
- Contract applied: product decisions above; framework files and docs left untouched.

## Verification

- `npx tsc -p tsconfig.json --noEmit`: passes.
- `npx vitest run src`: 743 passed, 9 skipped (framework contract gates plus product tests in `src/app/shelf/shelf-acceptance.test.ts` and `src/app/app-schema.test.ts`).
- `npm run ai:check`: code health passed (19 files).
- `scripts/check-toolcraft-integrity.mjs` (via `evaluateToolcraftIntegrity`): passes, including the product source boundary.
- `npx vite build`: passes.
- `node --test scripts/*.test.mjs`: 1306 passed, 7 failed. The failures are environmental or framework-internal, not product code: IPv6 loopback unavailable in this container (port finder), a global npm package outside the bounded resolution universe, one timing threshold, and tests expecting `pnpm` command text in an npm-generated app.
- Headless Chromium (SwiftShader): the shelf renders, the sequence plays through entry, lift, flight, drop, settle and reset, and Export PNG downloads a 4096x2304 `shelf-motion.png` of the current frame.
- Not run: `npm run verify:delivery` and the protected browser acceptance specs (`e2e/product-shelf.spec.ts` is declared in the acceptance rows but not yet written). No measured performance was run.
- Fallback note: `npm run dev` could not pick a port because this container has no IPv6 loopback (`::1` returns EAFNOSUPPORT), so Vite was started directly on 127.0.0.1 for inspection.

## Risks

- Risk: first delivery is not certified until `e2e/product-shelf.spec.ts` implements every declared browser row and `npm run verify:delivery` passes.
- Risk: framework conflict. The orientation gizmo contract requires direct model-drag orbit, but the product source boundary rejects pointer handlers on any product-owned host and offers no hit-test port for custom renderers. Orbit is therefore gizmo-only, and the `shelf.view` row's model-drag part cannot pass until Toolcraft provides a port.
- Risk: framework conflict. The DOM type-graph walk in the boundary checker overflows the stack on Three.js types, so `shelf-scene.ts` keeps Three.js values untyped (`any`) internally behind the typed `ShelfRenderer` interface, and frames are copied out with `drawImage` (read-back) instead of rendering into the product canvas directly.
- Risk: preview and export rely on WebGL; a browser without WebGL shows nothing and export fails.
