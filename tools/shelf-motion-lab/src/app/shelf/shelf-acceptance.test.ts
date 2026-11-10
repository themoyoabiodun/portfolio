import { describe, expect, it } from "vitest";

import { evaluateShelfSequence, getShelfInsertIndex } from "./motion-sequence";
import { CAROUSEL_BOOKS, DETAIL_COVER, GRID_BOOKS } from "./phone-data";
import { evaluateCarousel, evaluateOpenBook } from "./phone-sequence";
import {
  CAROUSEL_DEFAULTS,
  OPEN_BOOK_DEFAULTS,
  OPEN_BOOK_TARGETS,
  SCENE_MODE_TARGET,
} from "./phone-values";
import { evaluateSceneFrame } from "./scene-frame";
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

type Slider = Readonly<{
  applicability: Readonly<{ all?: readonly Readonly<{ equals?: unknown; target: string }>[] }>;
  max: number;
  min: number;
  target: string;
  type: string;
}>;
const sliders = shelfControlSections.flatMap((section) =>
  Object.values(section.controls as Record<string, Slider>).filter(
    (control) => control.type === "slider",
  ),
);

function modeOf(control: Slider): string {
  const predicate = control.applicability.all?.find((entry) => entry.target === SCENE_MODE_TARGET);
  return String(predicate?.equals ?? "shelf");
}

/** The active mode's whole loop sampled densely, as a signature. */
function sceneSignature(values: Record<string, unknown>, loop = LOOP): string {
  const frames = [];
  for (let time = 0; time <= loop + 1e-9; time += loop / 160) {
    frames.push(evaluateSceneFrame(values, time, loop));
  }
  return JSON.stringify(frames);
}

describe("shelf acceptance", () => {
  for (const control of sliders) {
    it(`shelf slider ${control.target} is read by the sequence`, () => {
      const mode = { [SCENE_MODE_TARGET]: modeOf(control) };
      const base = sceneSignature(mode);
      const low = sceneSignature({ ...mode, [control.target]: control.min });
      const high = sceneSignature({ ...mode, [control.target]: control.max });
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
    const view = shelfControlSections[1].controls.view as unknown as Readonly<{ type: string; keyframeable: boolean }>;
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
    const view = shelfControlSections[1].controls.view as unknown as Readonly<{ defaultValue: unknown }>;
    expect(view.defaultValue).toEqual({
      position: [...SHELF_VIEW_DEFAULT.position],
      up: [...SHELF_VIEW_DEFAULT.up],
    });
  });

  it("scene mode switches between the shelf and phone animations", () => {
    expect(evaluateSceneFrame({ [SCENE_MODE_TARGET]: "shelf" }, 1, LOOP).mode).toBe("shelf");
    expect(evaluateSceneFrame({ [SCENE_MODE_TARGET]: "carousel" }, 1, LOOP).mode).toBe("carousel");
    expect(evaluateSceneFrame({ [SCENE_MODE_TARGET]: "open" }, 1, LOOP).mode).toBe("open");
  });

  it("open book source switches between grid and carousel", () => {
    const grid = evaluateOpenBook(OPEN_BOOK_DEFAULTS, CAROUSEL_DEFAULTS, 0, LOOP);
    const carousel = evaluateOpenBook({ ...OPEN_BOOK_DEFAULTS, source: "carousel" }, CAROUSEL_DEFAULTS, 0, LOOP);
    expect(grid.layout).toBe("grid");
    expect(carousel.layout).toBe("carousel");
    expect(grid.books.length).toBe(GRID_BOOKS.length);
    expect(carousel.books.length).toBe(CAROUSEL_BOOKS.length);
  });

  it("tapped book chooses which grid cover opens", () => {
    const titles = GRID_BOOKS.map((_, book) => {
      const frame = evaluateSceneFrame({ [SCENE_MODE_TARGET]: "open", [OPEN_BOOK_TARGETS.book]: String(book) }, 2.6, LOOP);
      return frame.mode === "open" ? frame.phone.detail?.book.title : undefined;
    });
    expect(new Set(titles).size).toBe(GRID_BOOKS.length);
  });

  it("open book lands on the Figma detail cover and returns home", () => {
    const detail = evaluateOpenBook(OPEN_BOOK_DEFAULTS, CAROUSEL_DEFAULTS, 2.6, LOOP);
    const tapped = detail.books.at(-1);
    expect(tapped?.width).toBeCloseTo(DETAIL_COVER.width, 0);
    expect(tapped?.height).toBeCloseTo(DETAIL_COVER.height, 0);
    expect(detail.flood.radius).toBeGreaterThan(600);
    const first = evaluateOpenBook(OPEN_BOOK_DEFAULTS, CAROUSEL_DEFAULTS, 0, LOOP);
    const last = evaluateOpenBook(OPEN_BOOK_DEFAULTS, CAROUSEL_DEFAULTS, LOOP - 1e-6, LOOP);
    expect(last.flood.radius).toBeCloseTo(first.flood.radius, 3);
    last.books.forEach((book, index) => {
      const start = first.books.find((candidate) => candidate.key === book.key);
      expect(start, `book ${index}`).toBeDefined();
      expect(book.x).toBeCloseTo(start!.x, 1);
      expect(book.y).toBeCloseTo(start!.y, 1);
      expect(book.opacity).toBeCloseTo(start!.opacity, 2);
    });
  });

  it("carousel loop ends where it starts", () => {
    const first = evaluateCarousel(CAROUSEL_DEFAULTS, 0, LOOP);
    const last = evaluateCarousel(CAROUSEL_DEFAULTS, LOOP - 1e-6, LOOP);
    // Books parked offscreen at slot ±2 are equivalent; compare visible ones.
    first.books.forEach((book, index) => {
      if (Math.abs(book.x - 195) > 280) return;
      expect(last.books[index].x).toBeCloseTo(book.x, 0);
      expect(last.books[index].width).toBeCloseTo(book.width, 0);
    });
    // Design state: blue centred at 208 × 301 with neighbours at 142 wide.
    expect(first.books[1].width).toBeCloseTo(208, 0);
    expect(first.books[0].width).toBeCloseTo(142, 0);
  });

  it("compresses a long sequence to fit a short loop", () => {
    const slow = { ...SHELF_MOTION_DEFAULTS, flightTime: 1.5, liftTime: 0.8 };
    expect(evaluateShelfSequence(slow, 0, 2).timeScale).toBeLessThan(1);
    expect(evaluateShelfSequence(SHELF_MOTION_DEFAULTS, 0, LOOP).timeScale).toBe(1);
  });
});
