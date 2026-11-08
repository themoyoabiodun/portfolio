import * as React from "react";
import { getToolcraftTimelineLoopTime } from "@/toolcraft/runtime";
import {
  readToolcraftOrientationPose,
  useToolcraftEvaluatedValues,
  useToolcraftPipeline,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
  useToolcraftValue,
  useToolcraftViewportInteractionActive,
} from "@/toolcraft/runtime/react";

import { evaluateShelfSequence } from "./motion-sequence";
import {
  readShelfMotionConfig,
  SHELF_VIEW_DEFAULT,
  SHELF_VIEW_TARGET,
} from "./motion-values";
import { previewRenderPass, sceneResourcesPass } from "./shelf-pipeline";
import { createShelfRenderer, type ShelfRenderer } from "./shelf-scene";
import styles from "./shelf-canvas.module.css";

let nextCanvasId = 0;

function readRenderScale(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 2;
}

export function ShelfCanvas(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sceneRef = React.useRef<ShelfRenderer | null>(null);
  const [sceneReady, setSceneReady] = React.useState(false);
  const [canvasId] = React.useState(() => `shelf-${(nextCanvasId += 1)}`);
  const sceneFrame = useToolcraftProductSceneFrame();
  const rendererPipeline = useToolcraftPipeline();
  const renderScale = readRenderScale(useToolcraftValue("canvas.renderScale"));
  const values = useToolcraftEvaluatedValues();
  const timeSeconds = useToolcraftSelector((state) => state.timeline.currentTimeSeconds);
  const durationSeconds = useToolcraftSelector((state) => state.timeline.durationSeconds);
  const playing = useToolcraftSelector((state) => state.timeline.isPlaying);
  const viewportActive = useToolcraftViewportInteractionActive();
  const devicePixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  const config = React.useMemo(() => readShelfMotionConfig(values), [values]);
  const cameraPose = React.useMemo(
    () => readToolcraftOrientationPose(values[SHELF_VIEW_TARGET], SHELF_VIEW_DEFAULT),
    [values],
  );
  const loopTime = getToolcraftTimelineLoopTime({
    currentTimeSeconds: timeSeconds,
    durationSeconds,
  });
  const frame = React.useMemo(
    () => evaluateShelfSequence(config, loopTime, durationSeconds),
    [config, durationSeconds, loopTime],
  );

  const cssWidth = sceneFrame.kind === "ready" ? sceneFrame.rect.width : 0;
  const cssHeight = sceneFrame.kind === "ready" ? sceneFrame.rect.height : 0;
  const backingWidth = Math.ceil(cssWidth * devicePixelRatio * renderScale);
  const backingHeight = Math.ceil(cssHeight * devicePixelRatio * renderScale);

  // Retained scene: created once per canvas through the pipeline.
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let active = true;
    const create = () => createShelfRenderer();
    const ready = (scene: ShelfRenderer) => {
      if (!active) return;
      sceneRef.current = scene;
      setSceneReady(true);
    };
    if (rendererPipeline) {
      void rendererPipeline
        .runPass(sceneResourcesPass, { "renderer.resources": canvasId }, (context) =>
          context.getOrCreateResource([canvasId], create, (scene) => scene.dispose()),
        )
        .then(ready, (error: unknown) => console.error(error));
    } else {
      ready(create());
    }
    return () => {
      active = false;
      sceneRef.current = null;
      setSceneReady(false);
      if (rendererPipeline) {
        void rendererPipeline.invalidatePass(sceneResourcesPass).cleanup;
      }
    };
  }, [canvasId, rendererPipeline]);

  // Draw the current frame. Playback frames are skipped while the viewport
  // is being dragged or zoomed and resume from the current time afterwards.
  const deferred = viewportActive && playing;
  React.useEffect(() => {
    const scene = sceneRef.current;
    if (!sceneReady || !scene || deferred || backingWidth <= 0 || backingHeight <= 0) {
      return undefined;
    }
    // Runtime state already updates once per animation frame, so each commit
    // draws exactly once; no extra frame scheduling that could be starved.
    const destination = canvasRef.current?.getContext("2d");
    if (!destination) return undefined;
    const draw = () => {
      scene.resize(backingWidth, backingHeight);
      scene.apply(frame, config.glowColor, cameraPose, cssWidth / cssHeight);
      destination.clearRect(0, 0, backingWidth, backingHeight);
      scene.present(destination, 0, 0, backingWidth, backingHeight);
    };
    if (rendererPipeline) void rendererPipeline.runPass(previewRenderPass, undefined, draw);
    else draw();
    return undefined;
  }, [
    backingHeight,
    backingWidth,
    cameraPose,
    config.glowColor,
    cssHeight,
    cssWidth,
    deferred,
    frame,
    rendererPipeline,
    sceneReady,
  ]);

  return (
    <div className={styles.root}>
      <canvas
        className={styles.canvas}
        data-shelf-backing={`${backingWidth}x${backingHeight}`}
        data-shelf-glow={frame.glow.intensity.toFixed(3)}
        data-shelf-insert-index={frame.insertIndex}
        data-shelf-phase={frame.phase}
        data-shelf-ready={String(sceneReady)}
        data-shelf-time={loopTime.toFixed(3)}
        data-toolcraft-product-output=""
        height={Math.max(1, backingHeight)}
        ref={canvasRef}
        style={{ height: cssHeight, width: cssWidth }}
        width={Math.max(1, backingWidth)}
      />
    </div>
  );
}
