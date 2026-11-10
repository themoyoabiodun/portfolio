// Canonical settings for the two phone modes, shared by schema, sequence,
// preview and export.
export type SceneMode = "carousel" | "open" | "shelf";
export type OpenSource = "carousel" | "grid";

export const SCENE_MODE_TARGET = "scene.mode";
export const SCENE_MODE_DEFAULT: SceneMode = "shelf";

export type CarouselConfig = Readonly<{
  dragAmount: number;
  dragTime: number;
  sideDepth: number;
  sideScale: number;
  sideTilt: number;
  snapBounce: number;
  snapTime: number;
  titleDelay: number;
  titleSlide: number;
}>;

export type OpenBookConfig = Readonly<{
  arc: number;
  backTime: number;
  book: number;
  floodTime: number;
  lift: number;
  part: number;
  press: number;
  rise: number;
  source: OpenSource;
  spineTurn: number;
  stagger: number;
  travelBounce: number;
  travelTime: number;
}>;

export const CAROUSEL_TARGETS = {
  dragAmount: "carousel.dragAmount",
  dragTime: "carousel.dragTime",
  sideDepth: "carousel.sideDepth",
  sideScale: "carousel.sideScale",
  sideTilt: "carousel.sideTilt",
  snapBounce: "carousel.snapBounce",
  snapTime: "carousel.snapTime",
  titleDelay: "carousel.titleDelay",
  titleSlide: "carousel.titleSlide",
} as const satisfies Record<keyof CarouselConfig, string>;

export const OPEN_BOOK_TARGETS = {
  arc: "openBook.arc",
  backTime: "detail.backTime",
  book: "openBook.book",
  floodTime: "detail.floodTime",
  lift: "openBook.lift",
  part: "openBook.part",
  press: "openBook.press",
  rise: "detail.rise",
  source: "openBook.source",
  spineTurn: "openBook.spineTurn",
  stagger: "detail.stagger",
  travelBounce: "openBook.travelBounce",
  travelTime: "openBook.travelTime",
} as const satisfies Record<keyof OpenBookConfig, string>;

export const CAROUSEL_DEFAULTS: CarouselConfig = Object.freeze({
  dragAmount: 0.25,
  dragTime: 0.18,
  sideDepth: 40,
  sideScale: 0.683,
  sideTilt: 14,
  snapBounce: 0.22,
  snapTime: 0.42,
  titleDelay: 0.35,
  titleSlide: 24,
});

export const OPEN_BOOK_DEFAULTS: OpenBookConfig = Object.freeze({
  arc: 30,
  backTime: 0.65,
  book: 2,
  floodTime: 0.6,
  lift: 80,
  part: 60,
  press: 0.03,
  rise: 14,
  source: "grid",
  spineTurn: 28,
  stagger: 0.06,
  travelBounce: 0.18,
  travelTime: 0.75,
});

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readSceneMode(value: unknown): SceneMode {
  return value === "carousel" || value === "open" || value === "shelf" ? value : SCENE_MODE_DEFAULT;
}

export function readCarouselConfig(values: Readonly<Record<string, unknown>>): CarouselConfig {
  const t = CAROUSEL_TARGETS;
  const d = CAROUSEL_DEFAULTS;
  return Object.freeze({
    dragAmount: num(values[t.dragAmount], d.dragAmount),
    dragTime: num(values[t.dragTime], d.dragTime),
    sideDepth: num(values[t.sideDepth], d.sideDepth),
    sideScale: num(values[t.sideScale], d.sideScale),
    sideTilt: num(values[t.sideTilt], d.sideTilt),
    snapBounce: num(values[t.snapBounce], d.snapBounce),
    snapTime: num(values[t.snapTime], d.snapTime),
    titleDelay: num(values[t.titleDelay], d.titleDelay),
    titleSlide: num(values[t.titleSlide], d.titleSlide),
  });
}

export function readOpenBookConfig(values: Readonly<Record<string, unknown>>): OpenBookConfig {
  const t = OPEN_BOOK_TARGETS;
  const d = OPEN_BOOK_DEFAULTS;
  const book = Number(values[t.book]);
  return Object.freeze({
    arc: num(values[t.arc], d.arc),
    backTime: num(values[t.backTime], d.backTime),
    book: Number.isInteger(book) && book >= 0 && book <= 5 ? book : d.book,
    floodTime: num(values[t.floodTime], d.floodTime),
    lift: num(values[t.lift], d.lift),
    part: num(values[t.part], d.part),
    press: num(values[t.press], d.press),
    rise: num(values[t.rise], d.rise),
    source: values[t.source] === "carousel" ? "carousel" : "grid",
    spineTurn: num(values[t.spineTurn], d.spineTurn),
    stagger: num(values[t.stagger], d.stagger),
    travelBounce: num(values[t.travelBounce], d.travelBounce),
    travelTime: num(values[t.travelTime], d.travelTime),
  });
}
