import {
  defineToolcraftDiscreteFixtureAdapter,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { appRendererPipelineRegistration } from "./shelf/shelf-pipeline";

export { appRendererPipelineRegistration };

const exportLongEdgeFixture = defineToolcraftDiscreteFixtureAdapter({
  dimensionId: "export-long-edge",
  domain: {
    kind: "schema-options",
    optionValues: ["2k", "4k", "8k"],
    target: "export.image.resolution",
  },
  entries: [
    { appliedValue: "2k", value: 2_048 },
    { appliedValue: "4k", value: 4_096 },
    { appliedValue: "8k", value: 8_192 },
  ],
});

const exportPixelFixture = defineToolcraftDiscreteFixtureAdapter({
  dimensionId: "export-pixels",
  domain: {
    attestation:
      "The three resolution options at the default 16:9 artboard exhaust the reachable exported pixel counts.",
    inputs: ["export-long-edge"],
    kind: "derived",
  },
  entries: [
    { appliedValue: "2k", value: 2_359_296 },
    { appliedValue: "4k", value: 9_437_184 },
    { appliedValue: "8k", value: 37_748_736 },
  ],
});

const basePerformance = defineToolcraftPerformance({
  fixtureAdapters: {
    dimensions: {
      "export-long-edge": exportLongEdgeFixture,
      "export-pixels": exportPixelFixture,
    },
  },
  rendererPipeline: appRendererPipelineRegistration,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "webgl",
    fidelityRisks: [
      "Preview and export must sample the same sequence time and camera pose so a frame exports exactly as seen.",
    ],
    gpu: {
      export: { backend: "webgl", provider: "three" },
      preview: { backend: "webgl", provider: "three" },
    },
    intentionalRasterizationReason:
      "The product is a lit, shadowed 3D scene; perspective shading and shadows only exist as rendered pixels.",
    layers: [
      {
        content: ["composite"],
        exportMode: "included",
        id: "shelfScene",
        kind: "product-foreground",
        primitiveCount: "medium",
        renderer: "webgl",
        uiSelector: "canvas[data-toolcraft-product-output]",
      },
    ],
    performanceRisks: [
      "Retina backing at render scale 2 multiplies fragment work for the shadowed scene during playback.",
    ],
    previewRenderer: "webgl",
    productRepresentation: "pixel",
    rendererStrategy: "webgl",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "CSS 3D cannot cast shadows or be rasterized into the runtime image export.",
      "Canvas 2D would need a hand-written 3D projection and lighting model.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 8_192,
        customMappingReason: "The image resolution option maps to its exact numeric long edge.",
        defaultValue: 4_096,
        id: "export-long-edge",
        mapping: "custom",
        source: { kind: "schema-target", target: "export.image.resolution" },
        unit: "pixels",
      },
      {
        batchMax: 37_748_736,
        defaultValue: 9_437_184,
        id: "export-pixels",
        mapping: "direct",
        source: { inputs: ["export-long-edge"], kind: "derived" },
        unit: "pixels",
      },
    ],
  },
} satisfies ToolcraftEnvelopePerformanceConfig);

const scenarioLocator = (interaction: string, targets: readonly string[]) => {
  if (interaction === "control-drag") {
    return targets.includes("shelf.view")
      ? { uiSelector: '[data-testid="toolcraft-orientation-gizmo"]' }
      : { controlLabel: "Lift height" };
  }
  if (interaction === "control-change") return { controlLabel: "Insert at" };
  if (interaction === "timeline-playback" || interaction === "timeline-scrub") {
    return { uiSelector: '[aria-label="Playback position"]' };
  }
  return {};
};

const scenarios = deriveToolcraftPerformancePaths(appSchema, basePerformance).map(
  (path): ToolcraftPerformanceScenario => {
    const common = {
      automated: true,
      automatedTestName: `perf: shelf ${path.id}`,
      browser: true,
      browserTestName: `browser perf: shelf ${path.id}`,
      coversTargets: path.targets,
      expectedObservable: `The ${path.interaction} path keeps full-quality WebGL output.`,
      fixture: "default shelf sequence",
      id: `shelf-${path.id}`,
      pathId: path.id,
      ...(path.targets.length === 1 ? { target: path.targets[0] } : {}),
    };
    if (path.interaction === "export") {
      return {
        ...common,
        actionValue: "export.png",
        completionEvidence: "download",
        controlLabel: "Export PNG",
        interaction: "export",
      };
    }
    return { ...common, ...scenarioLocator(path.interaction, path.targets), interaction: path.interaction };
  },
);

export const appPerformance = defineToolcraftPerformance({
  ...basePerformance,
  scenarios,
});

export const appPerformancePaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);
