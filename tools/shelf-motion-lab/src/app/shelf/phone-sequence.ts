// Home carousel and open-book transitions as pure functions of loop time,
// in Figma pixels on the 390 × 844 phone frame.
import { springProgress } from "./motion-sequence";
import {
  bookThickness,
  CAROUSEL_BOOKS,
  CAROUSEL_CENTRE,
  CAROUSEL_SPACING,
  CAROUSEL_START_INDEX,
  DETAIL_COVER,
  GRID_BOOKS,
  gridCoverRect,
  gridProgressRect,
  PHONE_HEIGHT,
  PHONE_WIDTH,
  type PhoneBook,
  type PhoneRect,
  rectCentre,
} from "./phone-data";
import type { CarouselConfig, OpenBookConfig } from "./phone-values";

const DEG = Math.PI / 180;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
const easeInOut = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const easeSine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));

export type PhoneBookPose = Readonly<{
  /** Centre of the cover, Figma pixels. */
  book: PhoneBook;
  /** Distance towards the camera, Figma pixels. */
  elevation: number;
  height: number;
  key: string;
  opacity: number;
  rotX: number;
  rotY: number;
  /** 0 = no shadow, 1 = the detail page's 15px blur. */
  shadow: number;
  thickness: number;
  width: number;
  x: number;
  y: number;
}>;

export type PhoneBarPose = Readonly<{
  book: PhoneBook;
  fill: number;
  fillColor: string;
  opacity: number;
  rect: PhoneRect;
}>;

export type PhoneTextPose = Readonly<{ dx: number; dy: number; opacity: number }>;

export type PhoneFrame = Readonly<{
  books: readonly PhoneBookPose[];
  carouselTitles: readonly Readonly<{ book: PhoneBook; pose: PhoneTextPose }>[];
  detail: Readonly<{
    book: PhoneBook;
    chrome: PhoneTextPose;
    items: Readonly<{
      author: PhoneTextPose;
      date: PhoneTextPose;
      pill: PhoneTextPose;
      progress: PhoneTextPose;
      title: PhoneTextPose;
    }>;
    progressFill: number;
  }> | null;
  flood: Readonly<{ radius: number; x: number; y: number }>;
  gridBars: readonly PhoneBarPose[];
  homeChromeOpacity: number;
  layout: "carousel" | "grid";
  phase: string;
}>;

const HIDDEN: PhoneTextPose = Object.freeze({ dx: 0, dy: 0, opacity: 0 });

function wrapSlot(slot: number, count: number): number {
  const half = count / 2;
  return ((((slot + half) % count) + count) % count) - half;
}

/** One carousel book at a continuous slot (0 = centre, ±1 = neighbours). */
function carouselPose(
  book: PhoneBook,
  slot: number,
  config: CarouselConfig,
): PhoneBookPose {
  const away = Math.min(Math.abs(slot), 1);
  const scale = lerp(1, config.sideScale, away);
  const width = CAROUSEL_CENTRE.width * scale;
  return Object.freeze({
    book,
    elevation: -config.sideDepth * away,
    height: CAROUSEL_CENTRE.height * scale,
    key: book.id,
    opacity: 1,
    rotX: 0,
    rotY: Math.sign(slot) * away * config.sideTilt * DEG,
    shadow: 1 - away,
    thickness: bookThickness(width),
    width,
    x: PHONE_WIDTH / 2 + slot * CAROUSEL_SPACING,
    y: CAROUSEL_CENTRE.y + CAROUSEL_CENTRE.height / 2,
  });
}

function carouselTitles(slots: readonly number[], config: CarouselConfig) {
  return CAROUSEL_BOOKS.map((book, index) => {
    const slot = slots[index];
    const closeness = 1 - Math.min(Math.abs(slot), 1);
    const delay = Math.min(config.titleDelay, 0.95);
    const shown = easeInOut((closeness - delay) / (1 - delay));
    return Object.freeze({
      book,
      pose: Object.freeze({
        dx: Math.max(-1, Math.min(1, slot)) * config.titleSlide,
        dy: 0,
        opacity: shown,
      }),
    });
  });
}

const BEATS = CAROUSEL_BOOKS.length;

/** Carousel swipe progress (0..BEATS) at loop time t. */
export function carouselPosition(
  config: CarouselConfig,
  timeSeconds: number,
  loopSeconds: number,
): Readonly<{ phase: string; position: number }> {
  const beat = loopSeconds / BEATS;
  const index = Math.min(BEATS - 1, Math.floor(Math.max(0, timeSeconds) / beat));
  const local = Math.max(0, timeSeconds) - index * beat;
  const swipe = config.dragTime + config.snapTime * 1.25;
  const k = Math.min(1, (beat * 0.85) / Math.max(swipe, 0.001));
  const dwell = beat - swipe * k;
  const u = local - dwell;
  const drag = config.dragTime * k;
  let progress = 0;
  let phase = "dwell";
  if (u > 0 && u < drag) {
    phase = "drag";
    progress = config.dragAmount * easeSine(u / drag);
  } else if (u >= drag) {
    phase = "snap";
    progress =
      config.dragAmount +
      (1 - config.dragAmount) * springProgress(u - drag, config.snapTime * k, config.snapBounce);
  }
  return { phase, position: index + progress };
}

export function evaluateCarousel(
  config: CarouselConfig,
  timeSeconds: number,
  loopSeconds: number,
): PhoneFrame {
  const { phase, position } = carouselPosition(config, timeSeconds, loopSeconds);
  const slots = CAROUSEL_BOOKS.map((_, index) =>
    wrapSlot(index - CAROUSEL_START_INDEX - position, BEATS),
  );
  return Object.freeze({
    books: CAROUSEL_BOOKS.map((book, index) => carouselPose(book, slots[index], config)),
    carouselTitles: carouselTitles(slots, config),
    detail: null,
    flood: { radius: 0, x: PHONE_WIDTH / 2, y: PHONE_HEIGHT / 2 },
    gridBars: [],
    homeChromeOpacity: 1,
    layout: "carousel",
    phase,
  });
}

function farthestCorner(x: number, y: number): number {
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(PHONE_WIDTH - x, y),
    Math.hypot(x, PHONE_HEIGHT - y),
    Math.hypot(PHONE_WIDTH - x, PHONE_HEIGHT - y),
  );
}

export type OpenBookTiming = Readonly<{
  backStart: number;
  backTravel: number;
  press: number;
  reveal: number;
  scale: number;
  travel: number;
}>;

export function getOpenBookTiming(config: OpenBookConfig, loopSeconds: number): OpenBookTiming {
  const needed =
    0.45 + 0.12 + config.travelTime * 0.55 + 0.35 + 5 * config.stagger + 0.2 + 0.18 + config.backTime + 0.35;
  const scale = Math.min(1, loopSeconds / needed);
  const press = 0.45 * scale;
  const travel = press + 0.12 * scale;
  return Object.freeze({
    backStart: loopSeconds - (0.35 + config.backTime + 0.18) * scale,
    backTravel: loopSeconds - (0.35 + config.backTime) * scale,
    press,
    reveal: travel + config.travelTime * 0.55 * scale,
    scale,
    travel,
  });
}

export function evaluateOpenBook(
  config: OpenBookConfig,
  carousel: CarouselConfig,
  timeSeconds: number,
  loopSeconds: number,
): PhoneFrame {
  const t = Math.max(0, timeSeconds);
  const timing = getOpenBookTiming(config, loopSeconds);
  const k = timing.scale;
  const fromGrid = config.source === "grid";
  const tappedIndex = fromGrid ? config.book : CAROUSEL_START_INDEX;
  const tapped = fromGrid ? GRID_BOOKS[tappedIndex] : CAROUSEL_BOOKS[tappedIndex];

  const start: PhoneRect = fromGrid ? gridCoverRect(tappedIndex) : CAROUSEL_CENTRE;
  const startCentre = rectCentre(start);
  const endCentre = rectCentre(DETAIL_COVER);

  const travelSeconds = config.travelTime * k;
  const backSeconds = config.backTime * k;
  const forward = springProgress(t - timing.travel, travelSeconds, config.travelBounce);
  const back = springProgress(t - timing.backTravel, backSeconds, config.travelBounce * 0.5);
  const along = forward * (1 - back);
  const forwardU = clamp01((t - timing.travel) / travelSeconds);
  const backU = clamp01((t - timing.backTravel) / backSeconds);
  const bump = backU > 0 ? Math.sin(Math.PI * backU) : Math.sin(Math.PI * forwardU);
  const pressU = clamp01((t - timing.press) / (0.12 * k));
  const press = config.press * Math.sin(Math.PI * pressU) * (forwardU > 0 ? 0 : 1);

  const dx = endCentre.x - startCentre.x;
  const dy = endCentre.y - startCentre.y;
  const length = Math.hypot(dx, dy) || 1;
  const arcX = (-dy / length) * config.arc * bump;
  const arcY = (dx / length) * config.arc * bump;

  const width = lerp(start.width, DETAIL_COVER.width, along) * (1 - press);
  const height = lerp(start.height, DETAIL_COVER.height, along) * (1 - press);
  const tappedPose: PhoneBookPose = Object.freeze({
    book: tapped,
    elevation: config.lift * bump,
    height,
    key: `tapped-${tapped.id}`,
    opacity: 1,
    rotX: -6 * DEG * bump,
    rotY: config.spineTurn * DEG * bump,
    shadow: lerp(fromGrid ? 0.25 : 1, 1, along) + 0.3 * bump,
    thickness: bookThickness(width),
    width,
    x: lerp(startCentre.x, endCentre.x, along) + arcX,
    y: lerp(startCentre.y, endCentre.y, along) + arcY,
  });

  // Everything else parts away from the tapped cover, then returns.
  const partWindow = 0.5 * travelSeconds;
  const returnWindow = 0.6 * backSeconds;
  const others: { centre: { x: number; y: number }; pose: PhoneBookPose; bar?: number }[] = [];
  if (fromGrid) {
    GRID_BOOKS.forEach((book, index) => {
      if (index === tappedIndex) return;
      const rect = gridCoverRect(index);
      const width = rect.width;
      others.push({
        bar: index,
        centre: rectCentre(rect),
        pose: {
          book,
          elevation: 0,
          height: rect.height,
          key: book.id,
          opacity: 1,
          rotX: 0,
          rotY: 0,
          shadow: 0.25,
          thickness: bookThickness(width),
          width,
          x: rectCentre(rect).x,
          y: rectCentre(rect).y,
        },
      });
    });
  } else {
    CAROUSEL_BOOKS.forEach((book, index) => {
      if (index === tappedIndex) return;
      const pose = carouselPose(book, wrapSlot(index - CAROUSEL_START_INDEX, BEATS), carousel);
      others.push({ centre: { x: pose.x, y: pose.y }, pose });
    });
  }
  const ranked = [...others].sort(
    (a, b) =>
      Math.hypot(a.centre.x - startCentre.x, a.centre.y - startCentre.y) -
      Math.hypot(b.centre.x - startCentre.x, b.centre.y - startCentre.y),
  );
  const books: PhoneBookPose[] = [];
  const bars: PhoneBarPose[] = [];
  const shift = (centre: { x: number; y: number }, rank: number) => {
    const delay = rank * 0.03 * k;
    const out = easeOut((t - timing.travel - delay) / partWindow);
    const home = easeInOut((t - timing.backTravel - backSeconds * 0.25 - delay) / returnWindow);
    const amount = out * (1 - home);
    const ox = centre.x - startCentre.x;
    const oy = centre.y - startCentre.y;
    const norm = Math.hypot(ox, oy) || 1;
    return { amount, dx: (ox / norm) * config.part * amount, dy: (oy / norm) * config.part * amount };
  };
  ranked.forEach((entry, rank) => {
    const { amount, dx: sx, dy: sy } = shift(entry.centre, rank);
    const scale = 1 - 0.06 * amount;
    books.push({
      ...entry.pose,
      height: entry.pose.height * scale,
      opacity: entry.pose.opacity * (1 - amount),
      width: entry.pose.width * scale,
      x: entry.pose.x + sx,
      y: entry.pose.y + sy,
    });
    if (entry.bar !== undefined) {
      const rect = gridProgressRect(entry.bar);
      const book = GRID_BOOKS[entry.bar];
      bars.push({
        book,
        fill: book.progress,
        fillColor: book.progress >= 1 ? "#39850D" : "#181818",
        opacity: 1 - amount,
        rect: { ...rect, x: rect.x + sx, y: rect.y + sy },
      });
    }
  });
  if (fromGrid) {
    const rect = gridProgressRect(tappedIndex);
    const away = clamp01((t - timing.travel) / (0.15 * k));
    const backHome = clamp01((t - timing.backTravel - backSeconds * 0.8) / (0.2 * k));
    bars.push({
      book: tapped,
      fill: tapped.progress,
      fillColor: tapped.progress >= 1 ? "#39850D" : "#181818",
      opacity: 1 - away * (1 - backHome),
      rect,
    });
  }
  books.push(tappedPose);

  // Navy floods out from the tapped cover and drains back into it.
  const floodOut = easeInOut((t - timing.travel) / (config.floodTime * k));
  const floodIn = easeInOut((t - timing.backTravel) / (backSeconds * 0.9));
  const radius = farthestCorner(startCentre.x, startCentre.y) * floodOut * (1 - floodIn);

  // Detail page items rise in one after another, then leave together.
  const fadeOut = 1 - clamp01((t - timing.backStart) / (0.18 * k));
  const item = (order: number): PhoneTextPose => {
    const shown = easeOut((t - timing.reveal - order * config.stagger * k) / (0.35 * k));
    return Object.freeze({ dx: 0, dy: config.rise * (1 - shown), opacity: shown * fadeOut });
  };
  const progress = item(0);
  const detailVisible = t >= timing.reveal && fadeOut > 0;

  let phase = "home";
  if (t >= timing.press) phase = "press";
  if (t >= timing.travel) phase = "travel";
  if (t >= timing.reveal) phase = "reveal";
  if (t >= timing.reveal + (0.35 + 5 * config.stagger) * k) phase = "detail";
  if (t >= timing.backStart) phase = "back";
  if (t >= timing.backTravel + backSeconds) phase = "home-return";

  const titleFade = 1 - clamp01((t - timing.travel) / (0.15 * k));
  const titleBack = clamp01((t - timing.backTravel - backSeconds * 0.8) / (0.2 * k));
  return Object.freeze({
    books,
    carouselTitles: fromGrid
      ? []
      : CAROUSEL_BOOKS.map((book, index) => ({
          book,
          pose: index === tappedIndex ? { dx: 0, dy: 0, opacity: Math.max(titleFade, titleBack) } : HIDDEN,
        })),
    detail: detailVisible
      ? Object.freeze({
          book: tapped,
          chrome: item(5),
          items: Object.freeze({ author: item(4), date: item(2), pill: item(1), progress, title: item(3) }),
          progressFill: tapped.progress * easeOut(progress.opacity / Math.max(fadeOut, 1e-6)),
        })
      : null,
    flood: { radius, x: startCentre.x, y: startCentre.y },
    gridBars: bars,
    homeChromeOpacity: 1,
    layout: fromGrid ? "grid" : "carousel",
    phase,
  });
}
