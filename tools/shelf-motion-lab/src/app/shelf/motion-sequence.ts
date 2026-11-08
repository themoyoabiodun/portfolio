// The add-to-shelf sequence as a pure function of loop time. Preview,
// scrubbing and export all sample this, so any frame is reproducible.
import { HERO_BOOK, SHELF_BOOKS, SHELF_GAP, type ShelfBook } from "./shelf-books";
import type { ShelfMotionConfig, ShelfInsertPosition } from "./motion-values";

export const SHELF_TOP_Y = 0;
export const SHELF_FRONT_Z = 0.8;
export const HERO_REST = Object.freeze({ x: 0, y: 3.35, z: 1.9 });

const ENTRY = 0.35;
const PAUSE = 0.25;
const SETTLE = 0.75;
const RESET = 0.45;
const MIN_HOLD = 0.1;
const DEG = Math.PI / 180;

export type ShelfSequencePhase =
  | "anticipation"
  | "drop"
  | "entry"
  | "flight"
  | "hold"
  | "lift"
  | "pause"
  | "reset"
  | "settle";

export type ShelfBookPose = Readonly<{
  opacity: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  scaleXZ: number;
  scaleY: number;
  x: number;
  y: number;
  z: number;
}>;

export type ShelfSequenceFrame = Readonly<{
  books: readonly ShelfBookPose[];
  glow: Readonly<{ intensity: number; x: number; z: number }>;
  hero: ShelfBookPose;
  insertIndex: number;
  phase: ShelfSequencePhase;
  shelfOffsetY: number;
  timeScale: number;
}>;

function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
const easeInOut = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const easeInDrop = (u: number) => clamp01(u) ** 2.2;

/**
 * Closed-form damped spring step response from 0 to 1. Duration and bounce
 * follow the "visual duration + bounce" model designers tune in Motion.
 */
export function springProgress(
  elapsed: number,
  visualDuration: number,
  bounce: number,
): number {
  if (elapsed <= 0) return 0;
  const duration = Math.max(visualDuration, 0.001);
  const omega = (2 * Math.PI) / duration;
  const zeta = Math.min(1, Math.max(0.05, 1 - bounce));
  if (zeta >= 1) {
    return 1 - Math.exp(-omega * elapsed) * (1 + omega * elapsed);
  }
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const envelope = Math.exp(-zeta * omega * elapsed);
  return (
    1 -
    envelope *
      (Math.cos(damped * elapsed) +
        ((zeta * omega) / damped) * Math.sin(damped * elapsed))
  );
}

/** Quick push to 1, then a spring back to 0: impacts, nudges, bounces. */
function impulse(
  elapsed: number,
  rampTime: number,
  returnTime: number,
  bounce: number,
): number {
  if (elapsed <= 0) return 0;
  if (elapsed < rampTime) return easeOut(elapsed / rampTime);
  return 1 - springProgress(elapsed - rampTime, returnTime, bounce);
}

export function getShelfInsertIndex(
  insert: ShelfInsertPosition,
  count: number = SHELF_BOOKS.length,
): number {
  if (insert === "start") return 0;
  if (insert === "end") return count;
  return Math.floor(count / 2);
}

export type ShelfSlot = Readonly<{ x: number; y: number; z: number }>;

/** Centre of every book in a row centred on the shelf. */
export function layoutShelfRow(books: readonly ShelfBook[]): readonly ShelfSlot[] {
  const total =
    books.reduce((sum, book) => sum + book.depth, 0) +
    SHELF_GAP * Math.max(0, books.length - 1);
  let cursor = -total / 2;
  return books.map((book) => {
    const x = cursor + book.depth / 2;
    cursor += book.depth + SHELF_GAP;
    return Object.freeze({
      x,
      y: SHELF_TOP_Y + book.height / 2,
      z: SHELF_FRONT_Z - 0.1 - book.width / 2,
    });
  });
}

type Timing = Readonly<{
  anticipation: number;
  drop: number;
  entryEnd: number;
  flight: number;
  flightStart: number;
  impact: number;
  lift: number;
  liftStart: number;
  pauseEnd: number;
  resetStart: number;
  scale: number;
  settleEnd: number;
}>;

/** Phase start times; the whole sequence is compressed to fit the loop. */
export function getShelfSequenceTiming(
  config: ShelfMotionConfig,
  loopSeconds: number,
): Timing {
  const anticipation = config.anticipation > 0 ? config.anticipationTime : 0;
  const base =
    ENTRY +
    PAUSE +
    anticipation +
    config.liftTime * 0.8 +
    config.flightTime +
    config.dropTime +
    SETTLE +
    RESET +
    MIN_HOLD;
  const duration = Number.isFinite(loopSeconds) && loopSeconds > 0 ? loopSeconds : base;
  const scale = Math.min(1, duration / base);
  const entryEnd = ENTRY * scale;
  const pauseEnd = entryEnd + PAUSE * scale;
  const liftStart = pauseEnd + anticipation * scale;
  const flightStart = liftStart + config.liftTime * 0.8 * scale;
  const flight = config.flightTime * scale;
  const impact = flightStart + flight + config.dropTime * scale;
  return Object.freeze({
    anticipation: anticipation * scale,
    drop: config.dropTime * scale,
    entryEnd,
    flight,
    flightStart,
    impact,
    lift: config.liftTime * scale,
    liftStart,
    pauseEnd,
    resetStart: duration - RESET * scale,
    scale,
    settleEnd: impact + SETTLE * scale,
  });
}

function pose(fields: Partial<ShelfBookPose> & Pick<ShelfBookPose, "x" | "y" | "z">): ShelfBookPose {
  return Object.freeze({
    opacity: 1,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 1,
    scaleXZ: 1,
    scaleY: 1,
    ...fields,
  });
}

export function evaluateShelfSequence(
  config: ShelfMotionConfig,
  timeSeconds: number,
  loopSeconds: number,
): ShelfSequenceFrame {
  const timing = getShelfSequenceTiming(config, loopSeconds);
  const k = timing.scale;
  const t = Math.max(0, timeSeconds);
  const insertIndex = getShelfInsertIndex(config.insert);
  const baseSlots = layoutShelfRow(SHELF_BOOKS);
  const finalBooks = [
    ...SHELF_BOOKS.slice(0, insertIndex),
    HERO_BOOK,
    ...SHELF_BOOKS.slice(insertIndex),
  ];
  const finalSlots = layoutShelfRow(finalBooks);
  const target = finalSlots[insertIndex];
  const resetU = easeInOut((t - timing.resetStart) / (RESET * k));
  const keep = 1 - resetU;

  // Hero pose by phase.
  const anticipationU =
    timing.anticipation > 0
      ? easeInOut((t - timing.pauseEnd) / timing.anticipation)
      : 0;
  const squeeze = 1 - config.anticipation * anticipationU;
  const liftP = springProgress(t - timing.liftStart, timing.lift, config.liftBounce);
  const liftY = HERO_REST.y + config.lift * liftP;
  const liftRotX = lerp(-3 * DEG * anticipationU, config.liftTilt * DEG, liftP);
  const liftScale = lerp(squeeze, 1.03, liftP);

  const flightLiftP = springProgress(
    timing.flightStart - timing.liftStart,
    timing.lift,
    config.liftBounce,
  );
  const flightY0 = HERO_REST.y + config.lift * flightLiftP;
  const flightRotX0 = lerp(-3 * DEG, config.liftTilt * DEG, flightLiftP);
  const flightScale0 = lerp(1 - config.anticipation, 1.03, flightLiftP);
  const flightP = springProgress(t - timing.flightStart, timing.flight, config.flightBounce);
  const turnP = springProgress(t - timing.flightStart, timing.flight, config.flightBounce * 0.6);
  const flightU = clamp01((t - timing.flightStart) / timing.flight);
  const aboveSlot = target.y + config.dropHeight;
  const flightX = lerp(HERO_REST.x, target.x, flightP);
  const flightZ = lerp(HERO_REST.z, target.z, flightP);
  const flightY =
    lerp(flightY0, aboveSlot, flightP) + config.arc * Math.sin(Math.PI * flightU);
  const rotY = (Math.PI / 2 + Math.PI * 2 * config.spins) * turnP;

  const dropStart = timing.flightStart + timing.flight;
  const dropStartP = springProgress(timing.flight, timing.flight, config.flightBounce);
  const dropY0 = lerp(flightY0, aboveSlot, dropStartP);
  const impactT = t - timing.impact;
  const shelfDip = config.shelfBounce * impulse(impactT, 0.06 * k, 0.4 * k, 0.5) * keep;
  const squash = config.squash * impulse(impactT, 0.06 * k, 0.35 * k, config.settleBounce) * keep;

  let phase: ShelfSequencePhase;
  let hero: ShelfBookPose;
  if (t < timing.entryEnd) {
    phase = "entry";
    const u = easeOut(t / timing.entryEnd);
    hero = pose({
      opacity: u,
      rotY: -0.5 * (1 - u),
      scale: lerp(0.9, 1, u),
      x: HERO_REST.x,
      y: HERO_REST.y - 0.35 * (1 - u),
      z: HERO_REST.z,
    });
  } else if (t < timing.liftStart) {
    phase = t < timing.pauseEnd ? "pause" : "anticipation";
    hero = pose({
      rotX: -3 * DEG * anticipationU,
      scale: squeeze,
      x: HERO_REST.x,
      y: HERO_REST.y,
      z: HERO_REST.z,
    });
  } else if (t < timing.flightStart) {
    phase = "lift";
    hero = pose({
      rotX: liftRotX,
      scale: liftScale,
      x: HERO_REST.x,
      y: liftY,
      z: HERO_REST.z,
    });
  } else if (t < dropStart) {
    phase = "flight";
    hero = pose({
      rotX: flightRotX0 * (1 - flightP),
      rotY,
      rotZ: config.flightTilt * DEG * Math.sin(Math.PI * flightU),
      scale: lerp(flightScale0, 1, flightP),
      x: flightX,
      y: flightY,
      z: flightZ,
    });
  } else if (t < timing.impact) {
    phase = "drop";
    hero = pose({
      rotY,
      x: flightX,
      y: lerp(dropY0, target.y, easeInDrop((t - dropStart) / timing.drop)),
      z: flightZ,
    });
  } else {
    phase =
      t >= timing.resetStart ? "reset" : t < timing.settleEnd ? "settle" : "hold";
    const scaleY = 1 - squash;
    hero = pose({
      opacity: keep,
      rotY,
      scaleXZ: 1 + squash * 0.6,
      scaleY,
      x: flightX,
      y: SHELF_TOP_Y - shelfDip + (HERO_BOOK.height * scaleY) / 2,
      z: flightZ,
    });
  }

  // Shelf books: part to make room, then lean away from the impact.
  const partStart = timing.flightStart + (config.partAt / 100) * timing.flight;
  const part = springProgress(t - partStart, 0.45 * k, 0.2) * keep;
  const books = SHELF_BOOKS.map((book, index) => {
    const finalIndex = index < insertIndex ? index : index + 1;
    const base = baseSlots[index];
    const x = lerp(base.x, finalSlots[finalIndex].x, part);
    const side = index < insertIndex ? -1 : 1;
    const distance = side < 0 ? insertIndex - index : index - insertIndex + 1;
    let angle = 0;
    if (distance <= 3 && config.nudge !== 0) {
      const delay = (distance - 1) * 0.04 * k;
      angle =
        ((config.nudge * DEG) / distance ** 1.4) *
        impulse(impactT - delay, 0.08 * k, 0.45 * k, config.settleBounce) *
        keep;
    }
    // Lean outward around the bottom edge furthest from the new book.
    const rotZ = side < 0 ? angle : -angle;
    const pivotX = x + (side < 0 ? -book.depth / 2 : book.depth / 2);
    const relX = side < 0 ? book.depth / 2 : -book.depth / 2;
    const relY = book.height / 2;
    return pose({
      rotY: Math.PI / 2,
      rotZ,
      x: pivotX + relX * Math.cos(rotZ) - relY * Math.sin(rotZ),
      y: SHELF_TOP_Y - shelfDip + relX * Math.sin(rotZ) + relY * Math.cos(rotZ),
      z: base.z,
    });
  });

  let glow = 0;
  if (config.glow && impactT > 0) {
    const rise = 0.15 * k;
    glow =
      (impactT < rise
        ? easeOut(impactT / rise)
        : Math.exp(-(impactT - rise) / (0.45 * k))) * keep;
  }

  return Object.freeze({
    books: Object.freeze(books),
    glow: Object.freeze({ intensity: glow, x: target.x, z: target.z }),
    hero,
    insertIndex,
    phase,
    shelfOffsetY: -shelfDip,
    timeScale: k,
  });
}
