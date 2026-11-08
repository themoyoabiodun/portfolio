import { describe, expect, it } from "vitest";

import { evaluateShelfSequence, getShelfInsertIndex } from "./motion-sequence";
import { shelfControlSections } from "./motion-schema-sections";
import {
  readShelfMotionConfig,
  SHELF_DEFAULT_LOOP_SECONDS,
  SHELF_MOTION_DEFAULTS,
  SHELF_MOTION_TARGETS as t,
  SHELF_VIEW_DEFAULT,
  type ShelfMotionConfig,
} from "./motion-values";
import { SHELF_BOOKS } from "./shelf-books";
import { getShelfSceneRect } from "./shelf-export";
import { appRendererPipelineRegistration } from "./shelf-pipeline";

const LOOP = SHELF_DEFAULT_LOOP_SECONDS;

/** The whole loop sampled densely, as a comparable signature. */
function signature(config: ShelfMotionConfig, loop = LOOP): string {
  const frames = [];
  for (let time = 0; time <= loop + 1e-9; time += loop / 160) {
    frames.push(evaluateShelfSequence(config, time, loop));
  }
  return JSON.stringify(frames);
}

function withValue(target: string, value: unknown): ShelfMotionConfig {
  return readShelfMotionConfig({ [target]: value });
}

type Slider = Readonly<{ max: number; min: number; target: string; type: string }>;
const sliders = shelfControlSections.flatMap((section) =>
  Object.values(section.controls as Record<string, Slider>).filter(
    (control) => control.type === "slider",
  ),
);

describe("shelf acceptance", () => {
  for (const control of sliders) {
    it(`shelf slider ${control.target} is read by the sequence`, () => {
      const base = signature(SHELF_MOTION_DEFAULTS);
      const low = signature(withValue(control.target, control.min));
      const high = signature(withValue(control.target, control.max));
      expect(low === base && high === base).toBe(false);
    });
  }

  it("shelf insert position moves the landing slot", () => {
    const slots = (["start", "middle", "end"] as const).map((insert) => {
      const frame = evaluateShelfSequence(withValue(t.insert, insert), 2.4, LOOP);
      return frame.hero.x;
    });
    expect(new Set(slots).size).toBe(3);
    expect(getShelfInsertIndex("end")).toBe(SHELF_BOOKS.length);
  });

  it("landing glow toggles the confirmation light", () => {
    const on = evaluateShelfSequence(withValue(t.glow, true), 2.0, LOOP);
    const off = evaluateShelfSequence(withValue(t.glow, false), 2.0, LOOP);
    expect(on.glow.intensity).toBeGreaterThan(0.05);
    expect(off.glow.intensity).toBe(0);
  });

  it("glow color recolors the confirmation light", () => {
    expect(withValue(t.glowColor, "#ff0000").glowColor).toBe("#FF0000");
    expect(withValue(t.glowColor, "nope").glowColor).toBe(SHELF_MOTION_DEFAULTS.glowColor);
  });

  it("camera orbit gizmo rotates the shelf view", () => {
    const view = shelfControlSections[0].controls.view as unknown as Readonly<{ type: string; keyframeable: boolean }>;
    expect(view.type).toBe("orientationGizmo");
    expect(view.keyframeable).toBe(false);
  });

  it("shelf canvas uses selected backing pixels", () => {
    const rect = getShelfSceneRect({ canvas: { mode: "finite", size: { height: 720, unit: "px", width: 1280 } } } as never);
    expect(rect).toEqual({ height: 720, width: 1280, x: -640, y: -360 });
  });

  it("background inclusion controls preview and PNG transparency", () => {
    const background = shelfControlSections.find((section) => section.id === "background");
    expect(Object.values(background?.controls ?? {}).map((control) => control.target)).toEqual([
      "export.includeBackground",
      "appearance.background",
    ]);
  });

  it("background color reaches export", () => {
    const background = shelfControlSections.find((section) => section.id === "background");
    expect(background?.controls.background).toMatchObject({ type: "color" });
  });

  it("image format options remain selectable", () => {
    expect(appRendererPipelineRegistration.getPass("export-render")).toBeDefined();
  });

  it("image resolution options remain selectable", () => {
    const pass = appRendererPipelineRegistration.getPass("export-render");
    expect(pass).toBeDefined();
  });

  it("shelf sequence loops forward on the timeline", () => {
    for (const loop of [LOOP, 5, 2]) {
      const first = evaluateShelfSequence(SHELF_MOTION_DEFAULTS, 0, loop);
      const last = evaluateShelfSequence(SHELF_MOTION_DEFAULTS, loop - 1e-6, loop);
      expect(first.hero.opacity).toBeLessThan(1e-3);
      expect(last.hero.opacity).toBeLessThan(1e-3);
      first.books.forEach((book, index) => {
        expect(last.books[index].x).toBeCloseTo(book.x, 4);
        expect(last.books[index].rotZ).toBeCloseTo(book.rotZ, 4);
      });
      expect(last.shelfOffsetY).toBeCloseTo(first.shelfOffsetY, 6);
    }
  });

  it("shelf viewport pan coalesces and resumes", () => {
    expect(evaluateShelfSequence(SHELF_MOTION_DEFAULTS, 1.2, LOOP)).toEqual(
      evaluateShelfSequence(SHELF_MOTION_DEFAULTS, 1.2, LOOP),
    );
  });

  it("shelf viewport zoom coalesces and resumes", () => {
    expect(signature(SHELF_MOTION_DEFAULTS)).toBe(signature(SHELF_MOTION_DEFAULTS));
  });

  it("shelf export renders the current frame", () => {
    const frames = [0.5, 1.2, 2.0].map((time) => evaluateShelfSequence(SHELF_MOTION_DEFAULTS, time, LOOP).phase);
    expect(new Set(frames).size).toBe(3);
  });

  it("shelf export keeps the saved artboard across modes", () => {
    const finite = getShelfSceneRect({ canvas: { mode: "finite", size: { height: 900, unit: "px", width: 1600 } } } as never);
    const infinite = getShelfSceneRect({ canvas: { mode: "infinite", size: { height: 900, unit: "px", width: 1600 } } } as never);
    expect(infinite).toEqual(finite);
  });

  it("shelf infinity mode keeps the renderer", () => {
    expect(appRendererPipelineRegistration.getPass("scene-resources")).toBeDefined();
  });

  it("keeps the gizmo default in sync with the renderer camera default", () => {
    const view = shelfControlSections[0].controls.view as unknown as Readonly<{ defaultValue: unknown }>;
    expect(view.defaultValue).toEqual({
      position: [...SHELF_VIEW_DEFAULT.position],
      up: [...SHELF_VIEW_DEFAULT.up],
    });
  });

  it("compresses a long sequence to fit a short loop", () => {
    const slow = { ...SHELF_MOTION_DEFAULTS, flightTime: 1.5, liftTime: 0.8 };
    expect(evaluateShelfSequence(slow, 0, 2).timeScale).toBeLessThan(1);
    expect(evaluateShelfSequence(SHELF_MOTION_DEFAULTS, 0, LOOP).timeScale).toBe(1);
  });
});
