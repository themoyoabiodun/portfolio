// One frame of whichever mode is active, shared by preview and export.
import { evaluateShelfSequence, type ShelfSequenceFrame } from "./motion-sequence";
import { readShelfMotionConfig } from "./motion-values";
import { evaluateCarousel, evaluateOpenBook, type PhoneFrame } from "./phone-sequence";
import {
  readCarouselConfig,
  readOpenBookConfig,
  readSceneMode,
  SCENE_MODE_TARGET,
  type SceneMode,
} from "./phone-values";

export type SceneFrame =
  | Readonly<{ glowColor: string; mode: "shelf"; phase: string; shelf: ShelfSequenceFrame }>
  | Readonly<{ mode: "carousel" | "open"; phase: string; phone: PhoneFrame }>;

export function evaluateSceneFrame(
  values: Readonly<Record<string, unknown>>,
  loopTime: number,
  loopSeconds: number,
): SceneFrame {
  const mode: SceneMode = readSceneMode(values[SCENE_MODE_TARGET]);
  if (mode === "carousel") {
    const phone = evaluateCarousel(readCarouselConfig(values), loopTime, loopSeconds);
    return { mode, phase: phone.phase, phone };
  }
  if (mode === "open") {
    const phone = evaluateOpenBook(
      readOpenBookConfig(values),
      readCarouselConfig(values),
      loopTime,
      loopSeconds,
    );
    return { mode, phase: phone.phase, phone };
  }
  const config = readShelfMotionConfig(values);
  const shelf = evaluateShelfSequence(config, loopTime, loopSeconds);
  return { glowColor: config.glowColor, mode, phase: shelf.phase, shelf };
}
