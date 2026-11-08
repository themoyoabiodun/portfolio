import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { ShelfCanvas } from "./shelf/shelf-canvas";
import { getShelfSceneRect, shelfExportRenderer } from "./shelf/shelf-export";
import { appRendererPipelineRegistration } from "./shelf/shelf-pipeline";

export const appComposition = composeToolcraftApp(appSchema, {
  renderer: { pipelineRegistration: appRendererPipelineRegistration },
  scene: {
    canvasContent: <ShelfCanvas />,
    rasterFrameRenderer: shelfExportRenderer,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getShelfSceneRect(state)],
  },
});
