import {
  evaluateToolcraftTimelineValues,
  getToolcraftTimelineLoopTime,
  type ToolcraftProductExportRenderer,
  type ToolcraftSceneRect,
} from "@/toolcraft/runtime";
import { readToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import { evaluateSceneFrame } from "./scene-frame";
import {
  SHELF_VIEW_DEFAULT,
  SHELF_VIEW_TARGET,
} from "./motion-values";
import { exportRenderPass } from "./shelf-pipeline";
import { createShelfRenderer } from "./shelf-scene";

type ShelfExportState = Parameters<ToolcraftProductExportRenderer["renderFrame"]>[0]["state"];

/** The product frame is the canvas size, centred on the world origin. */
export function getShelfSceneRect(state: Pick<ShelfExportState, "canvas">): ToolcraftSceneRect {
  const { height, width } = state.canvas.size;
  return Object.freeze({ height, width, x: -width / 2, y: -height / 2 });
}

export const shelfExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "shelf-motion",
  async renderFrame({ context, frame, pixelRatio, rendererPipeline, signal, state, timeSeconds }) {
    signal.throwIfAborted();
    const values = evaluateToolcraftTimelineValues(state, timeSeconds);
    const pose = readToolcraftOrientationPose(values[SHELF_VIEW_TARGET], SHELF_VIEW_DEFAULT);
    const duration = state.timeline.durationSeconds;
    const loopTime = getToolcraftTimelineLoopTime({ currentTimeSeconds: timeSeconds, durationSeconds: duration });
    const sequence = evaluateSceneFrame(values, loopTime, duration);
    const width = Math.max(1, Math.round(frame.width * pixelRatio));
    const height = Math.max(1, Math.round(frame.height * pixelRatio));

    const draw = async () => {
      const scene = createShelfRenderer();
      try {
        scene.resize(width, height);
        const aspect = frame.width / frame.height;
        if (sequence.mode === "shelf") {
          scene.apply(sequence.shelf, sequence.glowColor, pose, aspect);
        } else {
          await scene.whenReady();
          signal.throwIfAborted();
          scene.applyPhone(sequence.phone, { defaultPosition: SHELF_VIEW_DEFAULT.position, position: pose.position }, aspect);
        }
        signal.throwIfAborted();
        scene.present(context, frame.x, frame.y, frame.width, frame.height);
      } finally {
        scene.dispose();
      }
    };
    if (rendererPipeline) await rendererPipeline.runPass(exportRenderPass, undefined, draw);
    else await draw();
  },
};
