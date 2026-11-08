// Canonical motion settings: one default table shared by the schema, the
// sequence, the preview and the export renderer.
export type ShelfInsertPosition = "end" | "middle" | "start";

export type ShelfMotionConfig = Readonly<{
  anticipation: number;
  anticipationTime: number;
  arc: number;
  dropHeight: number;
  dropTime: number;
  flightBounce: number;
  flightTime: number;
  flightTilt: number;
  glow: boolean;
  glowColor: string;
  insert: ShelfInsertPosition;
  lift: number;
  liftBounce: number;
  liftTilt: number;
  liftTime: number;
  nudge: number;
  partAt: number;
  settleBounce: number;
  shelfBounce: number;
  spins: number;
  squash: number;
}>;

export const SHELF_MOTION_TARGETS = {
  anticipation: "pickup.anticipation",
  anticipationTime: "pickup.anticipationTime",
  arc: "flight.arc",
  dropHeight: "landing.dropHeight",
  dropTime: "landing.dropTime",
  flightBounce: "flight.bounce",
  flightTime: "flight.duration",
  flightTilt: "flight.tilt",
  glow: "confirmation.glow",
  glowColor: "confirmation.glowColor",
  insert: "shelf.insert",
  lift: "pickup.lift",
  liftBounce: "pickup.bounce",
  liftTilt: "pickup.tilt",
  liftTime: "pickup.duration",
  nudge: "landing.nudge",
  partAt: "flight.partAt",
  settleBounce: "landing.settleBounce",
  shelfBounce: "landing.shelfBounce",
  spins: "flight.spins",
  squash: "landing.squash",
} as const satisfies Record<keyof ShelfMotionConfig, string>;

export const SHELF_MOTION_DEFAULTS: ShelfMotionConfig = Object.freeze({
  anticipation: 0.04,
  anticipationTime: 0.12,
  arc: 0.7,
  dropHeight: 0.25,
  dropTime: 0.14,
  flightBounce: 0.12,
  flightTime: 0.6,
  flightTilt: -10,
  glow: true,
  glowColor: "#FFD98A",
  insert: "middle",
  lift: 0.4,
  liftBounce: 0.3,
  liftTilt: 12,
  liftTime: 0.32,
  nudge: 7,
  partAt: 35,
  settleBounce: 0.45,
  shelfBounce: 0.03,
  spins: 0,
  squash: 0.08,
});

export const SHELF_VIEW_TARGET = "shelf.view";
export const SHELF_VIEW_DEFAULT = Object.freeze({
  position: Object.freeze([0, 2.4, 14]) as readonly [number, number, number],
  up: Object.freeze([0, 1, 0]) as readonly [number, number, number],
});

export const SHELF_BACKGROUND_TARGET = "appearance.background";
export const SHELF_BACKGROUND_DEFAULT = "#F2EEE7";
export const SHELF_DEFAULT_LOOP_SECONDS = 3.2;

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

function readInsert(value: unknown): ShelfInsertPosition {
  return value === "start" || value === "end" || value === "middle"
    ? value
    : SHELF_MOTION_DEFAULTS.insert;
}

/** Reads canonical runtime values (already timeline-evaluated) into a config. */
export function readShelfMotionConfig(
  values: Readonly<Record<string, unknown>>,
): ShelfMotionConfig {
  const t = SHELF_MOTION_TARGETS;
  const d = SHELF_MOTION_DEFAULTS;
  return Object.freeze({
    anticipation: readNumber(values[t.anticipation], d.anticipation),
    anticipationTime: readNumber(values[t.anticipationTime], d.anticipationTime),
    arc: readNumber(values[t.arc], d.arc),
    dropHeight: readNumber(values[t.dropHeight], d.dropHeight),
    dropTime: readNumber(values[t.dropTime], d.dropTime),
    flightBounce: readNumber(values[t.flightBounce], d.flightBounce),
    flightTime: readNumber(values[t.flightTime], d.flightTime),
    flightTilt: readNumber(values[t.flightTilt], d.flightTilt),
    glow: typeof values[t.glow] === "boolean" ? (values[t.glow] as boolean) : d.glow,
    glowColor: readColor(values[t.glowColor], d.glowColor),
    insert: readInsert(values[t.insert]),
    lift: readNumber(values[t.lift], d.lift),
    liftBounce: readNumber(values[t.liftBounce], d.liftBounce),
    liftTilt: readNumber(values[t.liftTilt], d.liftTilt),
    liftTime: readNumber(values[t.liftTime], d.liftTime),
    nudge: readNumber(values[t.nudge], d.nudge),
    partAt: readNumber(values[t.partAt], d.partAt),
    settleBounce: readNumber(values[t.settleBounce], d.settleBounce),
    shelfBounce: readNumber(values[t.shelfBounce], d.shelfBounce),
    spins: Math.round(readNumber(values[t.spins], d.spins)),
    squash: readNumber(values[t.squash], d.squash),
  });
}
