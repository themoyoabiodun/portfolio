import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { SHELF_MOTION_TARGETS, SHELF_VIEW_TARGET } from "./motion-values";
import type { ShelfRenderer } from "./shelf-scene";

type ShelfPasses = {
  "export-render": ToolcraftRendererPipelinePassContract<void>;
  "preview-render": ToolcraftRendererPipelinePassContract<void>;
  "scene-resources": ToolcraftRendererPipelinePassContract<
    ShelfRenderer,
    ShelfRenderer,
    readonly [string]
  >;
};

const t = SHELF_MOTION_TARGETS;

/** Sliders and the camera pose re-render every frame while dragged. */
export const SHELF_DRAG_TARGETS = [
  t.anticipation,
  t.anticipationTime,
  t.lift,
  t.liftTilt,
  t.liftTime,
  t.liftBounce,
  t.flightTime,
  t.flightBounce,
  t.arc,
  t.spins,
  t.flightTilt,
  t.partAt,
  t.dropHeight,
  t.dropTime,
  t.squash,
  t.settleBounce,
  t.nudge,
  t.shelfBounce,
  SHELF_VIEW_TARGET,
] as const;

export const SHELF_CHANGE_TARGETS = [
  t.insert,
  t.glow,
  t.glowColor,
  "export.includeBackground",
  "canvas.infinity",
  "canvas.aspectRatio",
  "canvas.size.width",
  "canvas.size.height",
  "canvas.renderScale",
] as const;

const previewOnly = ["preview-render"] as const;
const retained = { mustNotInvalidate: ["scene-resources"], retainedAccesses: ["scene-resources"] } as const;

export const appRendererPipelineRegistration =
  registerToolcraftRendererPipeline<ShelfPasses>()({
    interactionInvalidation: [
      { interaction: "initial-render", invalidates: ["scene-resources", "preview-render"], targets: ["canvas.initial-render"] },
      { interaction: "control-drag", invalidates: previewOnly, ...retained, targets: SHELF_DRAG_TARGETS },
      { interaction: "control-change", invalidates: previewOnly, ...retained, targets: SHELF_CHANGE_TARGETS },
      { interaction: "timeline-playback", invalidates: previewOnly, ...retained, targets: ["timeline.time"] },
      { interaction: "timeline-scrub", invalidates: previewOnly, ...retained, targets: ["timeline.time"] },
      { interaction: "viewport-drag", invalidates: previewOnly, ...retained, targets: ["canvas.viewport.offset"] },
      { interaction: "viewport-zoom", invalidates: previewOnly, ...retained, targets: ["canvas.viewport.zoom"] },
      { interaction: "export", invalidates: ["export-render"], targets: ["actions.output"] },
    ],
    passes: [
      {
        cacheKey: ["renderer.resources"],
        cost: { dimensions: [], frequency: "once", relationship: "constant" },
        gpu: { resources: "sampled-textures", stage: "render", state: "stateless", surfaces: ["preview"] },
        id: "scene-resources",
        inputs: ["renderer.resources"],
        invalidatedBy: ["renderer.resources"],
        kind: "preprocess",
        lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "gpu",
        sceneBounds: {
          kind: "intrinsic",
          reason: "The shelf camera viewport is the product frame; geometry outside it is not product output.",
        },
      },
      {
        cost: { dimensions: [], frequency: "frame", relationship: "constant" },
        gpu: { resources: "sampled-textures", stage: "render", state: "stateless", surfaces: ["preview"] },
        id: "preview-render",
        inputs: ["scene-resources", "timeline.time", ...SHELF_DRAG_TARGETS, ...SHELF_CHANGE_TARGETS],
        invalidatedBy: ["timeline.time", ...SHELF_DRAG_TARGETS, ...SHELF_CHANGE_TARGETS],
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "retina",
        runsOn: "gpu",
        sceneBounds: {
          kind: "intrinsic",
          reason: "The rendered perspective view fills exactly the product frame; the camera viewport is the output domain.",
        },
      },
      {
        cost: { dimensions: ["export-pixels"], frequency: "batch", relationship: "linear" },
        gpu: { resources: "sampled-textures", stage: "render", state: "stateless", surfaces: ["export"] },
        id: "export-render",
        inputs: ["export.image.resolution", "timeline.time", ...SHELF_DRAG_TARGETS, ...SHELF_CHANGE_TARGETS],
        invalidatedBy: ["export.image.resolution", "timeline.time", ...SHELF_DRAG_TARGETS, ...SHELF_CHANGE_TARGETS],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "gpu",
      },
    ],
    runtimeId: "shelf-motion-lab-v1",
  });

export const sceneResourcesPass = appRendererPipelineRegistration.getPass("scene-resources");
export const previewRenderPass = appRendererPipelineRegistration.getPass("preview-render");
export const exportRenderPass = appRendererPipelineRegistration.getPass("export-render");
