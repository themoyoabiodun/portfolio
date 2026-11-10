# Toolcraft App Agent Worklog

## Status

Mode: product

Active change: book-stack-phone-modes

## Decision Trail

### Change ID: book-stack-phone-modes

- Request: "I need you to update this tool based on this project I'm working on, let's figure out the transition of books when they're clicked to how they should display on their detailed page." (Figma node 72-2076), four Pinterest motion references, then "I also want the tool to cater for the sliding view of the book in the homepage. I've added the design." (Figma node 74-2077), then "Build".
- Task type: substantial feature (new product modes, renderer layer, reference study).
- User-visible result: a Scene section with an Animation selector (Shelf, Carousel, Open book). Carousel plays the Book Stack home carousel swiping through four covers; Open book plays a tapped cover travelling from the library grid (or the carousel centre) to the navy detail page and back. Both use the Figma screens rebuilt in 3D, with dedicated Carousel, Open Book and Detail Page controls.
- Source/reference checked: Figma file 5YusE8XzdQictaWqt2Bf9C nodes 72:1931 (library grid), 72:2012 (book detail), 74:2077 (home carousel) via get_design_context; 14 Figma icon SVGs rasterized at 3x into src/app/shelf/assets/figma. Motion references below.
- Reference inputs: four Pinterest videos (pins 737183032798006421, 64176363434087665, 737183032783522101, 826129125437093996), originals in docs/references/original, re-encoded at 25 fps so this container's ffmpeg 6.1 timestamps meet the study tolerance.
- Motion reference study: referenceId=motion-reference-v1-75daeaeea6c955b2dc93129d87c0215e13b7e6b526273c8e1ecda46552870863; studyId=motion-v1-4754fa7092909877a45d4cc11b24177ea27204cc8fde8c81316bf5cbeaecbb7a; sourceSha256=2ec2a06c312a8e57e72b8585e301d12e6fbfb01d081eb423de423d8d07ecbc65; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-4754fa7092909877a45d4cc11b24177ea27204cc8fde8c81316bf5cbeaecbb7a/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-75daeaeea6c955b2dc93129d87c0215e13b7e6b526273c8e1ecda46552870863; studyId=motion-v1-d0f1f63f36a0f94bbcf42851c4d0aded2958cf9ef6cba1b530067acb6758d650; sourceSha256=2ec2a06c312a8e57e72b8585e301d12e6fbfb01d081eb423de423d8d07ecbc65; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-d0f1f63f36a0f94bbcf42851c4d0aded2958cf9ef6cba1b530067acb6758d650/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-75ef0f0389682919ae9927f905ed5712fcb7adb93c44b0f0c2b60cff562b28ee; studyId=motion-v1-75ef0f0389682919ae9927f905ed5712fcb7adb93c44b0f0c2b60cff562b28ee; sourceSha256=d55133e48e2bdbfbcec079f97e692eca501ec6b3bfd57cf5b0f2a14624b16f44; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-75ef0f0389682919ae9927f905ed5712fcb7adb93c44b0f0c2b60cff562b28ee/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-9e84ea03613bfd50e90493ae5bb7449eda2704c352b347f6658c096db594f0c2; studyId=motion-v1-b78d581d8b8d15d8eec2a9d848b7e111563d856dfe361b5e3a941cffd1db69ef; sourceSha256=26951ec34c9ee56c9cd05bafc4194145de18eaa67e11243287882d16c0f78d90; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-b78d581d8b8d15d8eec2a9d848b7e111563d856dfe361b5e3a941cffd1db69ef/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-9e84ea03613bfd50e90493ae5bb7449eda2704c352b347f6658c096db594f0c2; studyId=motion-v1-e955362bae3ec5c715ab46693f9476b63dc03ca575f7a686656e244d8df7826a; sourceSha256=26951ec34c9ee56c9cd05bafc4194145de18eaa67e11243287882d16c0f78d90; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-e955362bae3ec5c715ab46693f9476b63dc03ca575f7a686656e244d8df7826a/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-ff30cdbe47af4d9283061c52aa724302bf1dea7da7337603b3d3f4a30429df07; studyId=motion-v1-dfa1f7c2401772e42744062548b9bf9a1e126dc8e8a0e49d55ac7730a3e467e3; sourceSha256=c984f9fa964fcf3dc2ea16439ce094788a4c97ac937ac1def8d93c143f4f8fef; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-dfa1f7c2401772e42744062548b9bf9a1e126dc8e8a0e49d55ac7730a3e467e3/contact-sheet.png; review=real-time,slowed
- Motion reference study: referenceId=motion-reference-v1-ff30cdbe47af4d9283061c52aa724302bf1dea7da7337603b3d3f4a30429df07; studyId=motion-v1-e3d3dc3688a2987341e91e444e2250056b2ba819c1abf95e0d5e3a4921835c4b; sourceSha256=c984f9fa964fcf3dc2ea16439ce094788a4c97ac937ac1def8d93c143f4f8fef; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-e3d3dc3688a2987341e91e444e2250056b2ba819c1abf95e0d5e3a4921835c4b/contact-sheet.png; review=real-time,slowed
- Review note: each study was reviewed as its contact sheet (12 fps overview plus densely expanded event windows) and the transition windows frame by frame; the clips were not watched as playing video in this session.
- Docs/contracts read: core/reference-study.md, core/layout.md (explicit product modes), schema-reference.md, acceptance-testing.md.
- Contract rules applied: explicit product mode in the first product section after Setup with user-quoted evidence; every other product control gates on the mode or is shared; reference behaviours mapped to acceptance rows through motionReferenceCoverage; Figma implemented from design context, not screenshots.
- View interaction intent: unchanged orbit on shelf.view; the phone screens apply the gizmo's rotation away from its default to a straight-on phone view.
- Interaction ownership: unchanged; all new settings are panel property edits.
- Decision: one shared Three.js renderer with a second PhoneStage scene; flat UI layers are Canvas 2D textures drawn from the Figma specs and icons; covers are extruded rounded-rect books with page edges and a spine strip; a stencil clips everything to the 54px-radius screen; the navy flood is a growing circle from the tapped cover. Loop default raised to 4.8 s so every mode fits.
- Alternatives rejected: Figma frame PNG exports (opaque, with grey phone corners baked in); a separate Toolcraft app (would duplicate shell, export and camera); flat 2D covers (the references all read as physical books).
- State/output mapping: scene.mode selects evaluateShelfSequence, evaluateCarousel or evaluateOpenBook (src/app/shelf/scene-frame.ts); carousel.* and openBook.*/detail.* feed those pure functions; preview and export share evaluateSceneFrame.
- Verification: see Verification below.
- Risks: see Risks below.

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

- Decision: playback timeline, default loop 4.8 s (raised from 3.2 s so the carousel gets four 1.2 s swipes and the open-book round trip holds on the detail page). Shelf mode: The loop starts with an empty stand and ends with the added book faded out and the gap closed, so first and last frames match. If the tuned sequence is longer than the loop, all beats compress proportionally.
- Reason: product animation uses the top playback timeline; scrubbing is the main way to inspect a beat.
- Evidence: `getShelfSequenceTiming` in `src/app/shelf/motion-sequence.ts`.

### Layers

- Decision: no Layers module.
- Reason: no layer workflow was requested.
- Evidence: `src/app/app-schema.ts` modules list.

### Controls

- Decision: Background source pair, then Scene (Animation mode selector and the shared camera gizmo), then mode-gated sections: Shelf, Pick Up, Flight, Landing, Confirmation for Shelf; Carousel for Carousel; Open Book and Detail Page for Open book. Sliders are continuous except Extra spins (discrete, 0–3).
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

- Change book-stack-phone-modes: `npx tsc -p tsconfig.json --noEmit` passes; `npx vitest run src` 767 passed, 9 skipped before this worklog update; headless Chromium scrubbed Carousel (design state at t=0 matches node 74:2077) and Open book (grid, travel, detail page matching node 72:2012) with no console errors.
- Initial change: `npx tsc` passes; `npm run ai:check` passed; integrity and product boundary passed; `npx vite build` passed; Export PNG downloaded a 4096x2304 frame.
- `node --test scripts/*.test.mjs`: 1306 passed, 7 failed on the initial change (environmental: no IPv6 loopback, a global npm package outside the resolution universe, a timing threshold, pnpm command text).
- Not run: `npm run verify:delivery` and the protected browser acceptance specs (`e2e/product-shelf.spec.ts` is declared in the acceptance rows but not yet written). No measured performance was run.
- Fallback note: `npm run dev` could not pick a port because this container has no IPv6 loopback (`::1` returns EAFNOSUPPORT), so Vite was started directly on 127.0.0.1 for inspection.

## Risks

- Risk: first delivery is not certified until `e2e/product-shelf.spec.ts` implements every declared browser row and `npm run verify:delivery` passes.
- Risk: framework conflict. The orientation gizmo contract requires direct model-drag orbit, but the product source boundary rejects pointer handlers on any product-owned host and offers no hit-test port for custom renderers. Orbit is therefore gizmo-only, and the `shelf.view` row's model-drag part cannot pass until Toolcraft provides a port.
- Risk: framework conflict. The DOM type-graph walk in the boundary checker overflows the stack on Three.js types, so `shelf-scene.ts` keeps Three.js values untyped (`any`) internally behind the typed `ShelfRenderer` interface, and frames are copied out with `drawImage` (read-back) instead of rendering into the product canvas directly.
- Risk: the reference studies use 25 fps re-encodes, not the original Pinterest files, because ffmpeg 6.1 prints frame times with too few digits for the 30 fps originals.
- Risk: titles, authors, dates and progress for books other than "Wayward Lives, Beautiful Experiments" and "There Was a Country" are placeholders chosen for the demo; Figma only specifies those two.
- Risk: preview and export rely on WebGL; a browser without WebGL shows nothing and export fails.
