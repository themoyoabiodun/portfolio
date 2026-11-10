import type {
  ToolcraftComponentAcceptance,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { shelfControlSections } from "./shelf/motion-schema-sections";
import {
  SHELF_DEFAULT_LOOP_SECONDS,
  SHELF_MOTION_TARGETS as t,
  SHELF_VIEW_TARGET,
} from "./shelf/motion-values";

import { appReferenceInputs, getReferenceCoverage } from "./reference-inputs";
import { OPEN_BOOK_TARGETS, SCENE_MODE_TARGET } from "./shelf/phone-values";

export { appControlSectionInventory } from "./app-control-inventory";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

const SPEC = "e2e/product-shelf.spec.ts";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "4.8 seconds fits the shelf add with a confirmation hold, four 1.2-second carousel swipes, and the open-book round trip with a detail hold.",
      seconds: SHELF_DEFAULT_LOOP_SECONDS,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
  referenceInputs: appReferenceInputs,
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Panel angle sliders would duplicate the runtime gizmo and detach the orbit from the visible shelf.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user asked to lean towards 3D; orbiting directly on the shelf or the gizmo keeps the camera change tied to the scene.",
        source: "usability-analysis",
      },
      id: "camera-orbit",
      reason: "The canvas owns camera orbit through the runtime gizmo and direct shelf drag.",
      surface: "canvas",
      target: SHELF_VIEW_TARGET,
    },
    {
      alternative: {
        reason:
          "Panel buttons would separate continuous panning from the spatial viewport feedback it controls.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail: "Usability comparison selects direct canvas dragging for viewport offset.",
        source: "usability-analysis",
      },
      id: "viewport-pan",
      reason: "The canvas owns viewport panning because the gesture moves the visible world frame.",
      surface: "canvas",
      target: "canvas.setOffset",
    },
    {
      alternative: {
        reason: "Panel controls would duplicate runtime zoom tools and detach zoom focus from the canvas.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail: "Usability comparison selects canvas wheel and runtime zoom gestures.",
        source: "usability-analysis",
      },
      id: "viewport-zoom",
      reason: "The canvas owns viewport zoom because scale and focus need immediate spatial feedback.",
      surface: "canvas",
      target: "canvas.setViewport",
    },
  ],
  mode: "product",
  productName: "Shelf Motion Lab",
  productSummary:
    "A 3D motion lab for a reading app: the add-to-shelf animation, the home carousel swipe and the open-book transition to the detail page, each on a looping timeline.",
  requestedBehavior:
    "Control how a book animates when it is added to a shelf, when the home carousel slides between books, and when a tapped book transitions to its detail page (from the Book Stack Figma screens), leaning towards 3D: tune every beat, scrub the timeline, orbit the camera and export a frame.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: [SHELF_VIEW_TARGET],
  },
};

type SliderControl = Readonly<{ label?: unknown; target: string; type: string }>;

/** One live-drag row per motion slider, derived from the schema. */
const sliderRows: ToolcraftComponentAcceptance[] = shelfControlSections.flatMap((section) =>
  Object.values(section.controls as Record<string, SliderControl>)
    .filter((control) => control.type === "slider")
    .map((control): ToolcraftComponentAcceptance => {
      const label = String(control.label);
      return {
        automated: true,
        automatedTestName: `shelf slider ${control.target} is read by the sequence`,
        browser: {
          budget: "standard",
          file: SPEC,
          testName: `browser acceptance: ${label} changes the shelf frame`,
        },
        componentType: "slider",
        evidence: "rendered-pixels",
        expectedObservable: `Dragging ${label} changes the rendered shelf frame at a fixed timeline time.`,
        fixture: "paused timeline at the phase the slider shapes",
        id: `shelf.${control.target}`,
        kind: "control",
        ...(getReferenceCoverage(`shelf.${control.target}`).length > 0
          ? { motionReferenceCoverage: getReferenceCoverage(`shelf.${control.target}`) }
          : {}),
        target: control.target,
        userAction: `Pause the timeline, scrub to the affected phase and drag ${label}.`,
      };
    }),
);

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the shelf schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName: "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "Canvas, motion values, timeline and panel workspace restore after a real reload.",
    fixture: "shelf persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction: "Change Canvas width and a motion slider, move Controls, then reload.",
  },
  ...sliderRows,
  {
    automated: true,
    automatedTestName: "scene mode switches between the shelf and phone animations",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Animation switches the scene",
    },
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable: "Shelf, Carousel and Open book render the shelf, the home carousel and the library grid, each with only its own controls.",
    fixture: "paused timeline at loop start",
    id: "scene.mode",
    kind: "control",
    optionCoverage: ["shelf", "carousel", "open"],
    target: SCENE_MODE_TARGET,
    userAction: "Select Shelf, Carousel and Open book.",
  },
  {
    automated: true,
    automatedTestName: "open book source switches between grid and carousel",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Open from switches the starting layout",
    },
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable: "Grid opens a cover from the library grid; Carousel opens the centred home carousel cover and hides Tapped book.",
    fixture: "Open book mode, paused mid-travel",
    id: "openBook.source",
    kind: "control",
    optionCoverage: ["grid", "carousel"],
    target: OPEN_BOOK_TARGETS.source,
    userAction: "Select Grid and Carousel in Open from.",
  },
  {
    automated: true,
    automatedTestName: "tapped book chooses which grid cover opens",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Tapped book chooses the travelling cover",
    },
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable: "Each option sends a different grid cover to the detail page with its own title and progress.",
    fixture: "Open book mode from the grid, paused on the detail page",
    id: "openBook.book",
    kind: "control",
    optionCoverage: ["0", "1", "2", "3", "4", "5"],
    target: OPEN_BOOK_TARGETS.book,
    userAction: "Choose each Tapped book option.",
  },
  {
    automated: true,
    automatedTestName: "shelf insert position moves the landing slot",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Insert at moves the landing slot",
    },
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable: "Start, Middle and End land the book in different shelf slots.",
    fixture: "paused timeline after the landing",
    id: "shelf.insert",
    kind: "control",
    optionCoverage: ["start", "middle", "end"],
    target: t.insert,
    userAction: "Select Start, Middle and End and compare the rendered shelf.",
  },
  {
    automated: true,
    automatedTestName: "landing glow toggles the confirmation light",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Landing glow toggles the confirmation light",
    },
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable: "Turning Landing glow off removes the warm light under the landed book and hides Glow color.",
    fixture: "paused timeline just after impact",
    id: "confirmation.glow",
    kind: "control",
    target: t.glow,
    userAction: "Toggle Landing glow at the impact frame.",
  },
  {
    automated: true,
    automatedTestName: "glow color recolors the confirmation light",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: Glow color recolors the confirmation light",
    },
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable: "A new Glow color changes the light under the landed book.",
    fixture: "paused timeline just after impact",
    id: "confirmation.glowColor",
    kind: "control",
    target: t.glowColor,
    userAction: "Pick a different Glow color at the impact frame.",
  },
  {
    automated: true,
    automatedTestName: "camera orbit gizmo rotates the shelf view",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: orientation gizmo orbits the shelf camera",
    },
    canvasHandle: {
      outputObservable: "The rendered shelf view rotates with the camera pose.",
      testId: "toolcraft-orientation-gizmo",
      writesTarget: SHELF_VIEW_TARGET,
    },
    componentType: "orientationGizmo",
    evidence: "rendered-pixels",
    expectedObservable: "Gizmo drag, axis snap and direct shelf drag rotate the rendered view; undo/reset restore it; export excludes the gizmo.",
    fixture: "paused timeline, maximum render scale",
    id: "shelf.view",
    interactionId: "camera-orbit",
    kind: "canvas-handle",
    orientationGizmoCoverage: "all-required-orientation-gizmo-behavior",
    target: SHELF_VIEW_TARGET,
    userAction: "Drag the gizmo, click an axis, drag the shelf, undo and double-click reset.",
  },
  {
    automated: true,
    automatedTestName: "shelf canvas uses selected backing pixels",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf render scale backing",
    },
    componentType: "canvas",
    evidence: "rendered-pixels",
    expectedObservable:
      "Canvas backing stays CSS size times device pixel ratio times the selected scale while steady, interacting and playing.",
    fixture: "finite shelf canvas",
    id: "shelf.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "playback", "steady"],
    },
    target: "canvas.renderScale",
    userAction: "Change Resolution scale and inspect live backing pixels.",
  },
  {
    automated: true,
    automatedTestName: "background inclusion controls preview and PNG transparency",
    backgroundOutputCoverage: [
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
      "infinity-viewport-color-and-dependency",
    ],
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf background inclusion controls output",
    },
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable: "Turning Background off removes the preview fill and exports transparent PNG corners.",
    fixture: "shelf background semantics",
    id: "shelf.background-inclusion",
    kind: "control",
    target: "export.includeBackground",
    userAction: "Toggle Background and compare preview and PNG alpha.",
  },
  {
    automated: true,
    automatedTestName: "background color reaches export",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf background color reaches export",
    },
    componentType: "color",
    evidence: "exported-bytes",
    expectedObservable: "The selected Background color appears at the exported frame corners.",
    fixture: "shelf selected background",
    id: "shelf.background-color",
    kind: "control",
    target: "appearance.background",
    userAction: "Change Background color and inspect decoded export corners.",
  },
  {
    automated: true,
    automatedTestName: "image format options remain selectable",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf image formats remain selectable",
    },
    componentType: "select",
    evidence: "product-output",
    expectedObservable: "PNG and JPG remain available image formats.",
    fixture: "shelf image formats",
    id: "shelf.image-format",
    kind: "control",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Select PNG and JPG and observe the selected format.",
  },
  {
    automated: true,
    automatedTestName: "image resolution options remain selectable",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf image resolutions remain selectable",
    },
    componentType: "select",
    evidence: "product-output",
    expectedObservable: "2K, 4K and 8K remain available image resolutions.",
    fixture: "shelf image resolutions",
    id: "shelf.image-resolution",
    kind: "control",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Select 2K, 4K and 8K and observe the selected resolution.",
  },
  {
    automated: true,
    automatedTestName: "shelf sequence loops forward on the timeline",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf timeline playback and loop",
    },
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Scrubbing moves the book through pick-up, flight and landing; the loop is forward-only and its first and last frames match, also after a duration edit.",
    fixture: "4.8 second loop in every mode",
    id: "shelf.timeline",
    kind: "runtime",
    target: "timeline.playback",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction: "Play, pause, scrub, edit duration and compare loop seam frames.",
  },
  {
    automated: true,
    automatedTestName: "shelf viewport pan coalesces and resumes",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf viewport pan coalesces and resumes",
    },
    componentType: "canvas viewport",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Viewport pan defers playback frames and resumes at the current time without changing playback state.",
    fixture: "playing shelf viewport",
    id: "shelf.viewport",
    interactionId: "viewport-pan",
    kind: "runtime",
    target: "canvas.setOffset",
    userAction: "Space-drag the canvas while the sequence plays.",
  },
  {
    automated: true,
    automatedTestName: "shelf viewport zoom coalesces and resumes",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf viewport zoom coalesces and resumes",
    },
    componentType: "canvas viewport",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Viewport zoom defers playback frames and resumes at the current time without changing playback state.",
    fixture: "playing shelf viewport",
    id: "shelf.viewport-zoom",
    interactionId: "viewport-zoom",
    kind: "runtime",
    target: "canvas.setViewport",
    userAction: "Zoom the canvas while the sequence plays.",
  },
  {
    actionCoverage: ["export.png"],
    automated: true,
    automatedTestName: "shelf export renders the current frame",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf image export",
    },
    componentType: "panelActions",
    evidence: "exported-bytes",
    exportArtifactCoverage: "all-required-image-export-behavior",
    expectedObservable: "PNG export contains the shelf frame at the current timeline time.",
    fixture: "paused shelf at the landing",
    id: "shelf.image-export",
    kind: "control",
    target: "actions.output",
    userAction: "Export PNG and inspect decoded pixels.",
  },
  {
    automated: true,
    automatedTestName: "shelf export keeps the saved artboard across modes",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf export preserves framing across Infinity",
    },
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable: "Infinity PNG export keeps the saved artboard dimensions and content.",
    fixture: "shelf scene-bounds export",
    id: "shelf.infinity-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity and compare decoded exports.",
  },
  {
    automated: true,
    automatedTestName: "shelf infinity mode keeps the renderer",
    browser: {
      budget: "standard",
      file: SPEC,
      testName: "browser acceptance: shelf Infinity mode continuity",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable: "Infinity removes only the artboard boundary; the shelf renderer and backing stay continuous.",
    fixture: "infinite shelf bounds",
    id: "shelf.infinity-mode",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity both directions.",
  },
];
