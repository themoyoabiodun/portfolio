// Book Stack phone screens, from Figma file 5YusE8XzdQictaWqt2Bf9C:
// library grid 72:1931, book detail 72:2012, home carousel 74:2077.
// All geometry is in Figma pixels on the 390 × 844 iPhone frame.

export const PHONE_WIDTH = 390;
export const PHONE_HEIGHT = 844;
export const PHONE_RADIUS = 54;
export const PHONE_WHITE = "#FFFFFF";
export const PHONE_NAVY = "#051324";

export type PhoneBook = Readonly<{
  author: string;
  color: string;
  date: string;
  id: string;
  progress: number;
  status: "Finished" | "Reading";
  title: string;
}>;

export type PhoneRect = Readonly<{ height: number; width: number; x: number; y: number }>;

function book(
  id: string,
  color: string,
  title: string,
  author: string,
  progress: number,
  date: string,
): PhoneBook {
  return Object.freeze({
    author,
    color,
    date,
    id,
    progress,
    status: progress >= 1 ? "Finished" : "Reading",
    title,
  });
}

/** Library grid covers, left to right and top to bottom (72:1969, 72:1982). */
export const GRID_BOOKS: readonly PhoneBook[] = Object.freeze([
  book("green", "#39902C", "Things Fall Apart", "Chinua Achebe", 32 / 108.67, "3 August 2026"),
  book("brown", "#90402C", "Homegoing", "Yaa Gyasi", 101 / 108.67, "28 July 2026"),
  book("blue", "#2C5990", "Wayward Lives, Beautiful Experiments", "Saidiya Hartman", 0.12, "17 September 2026"),
  book("red", "#BC0000", "Americanah", "Chimamanda Ngozi Adichie", 32 / 108.67, "9 September 2026"),
  book("charcoal", "#3D3D3D", "Beloved", "Toni Morrison", 1, "1 June 2026"),
  book("white", "#FFFFFF", "The Fire Next Time", "James Baldwin", 10 / 108.67, "14 September 2026"),
]);

const GRID_COLUMNS = [16, 140.67, 265.33] as const;
const GRID_ROWS = [225, 425] as const;
export const GRID_COVER = Object.freeze({ height: 158, width: 108.67 });

export function gridCoverRect(index: number): PhoneRect {
  return Object.freeze({
    height: GRID_COVER.height,
    width: GRID_COVER.width,
    x: GRID_COLUMNS[index % 3],
    y: GRID_ROWS[Math.floor(index / 3) % 2],
  });
}

/** Grid progress track sits 12px under each cover, 7px tall (72:1972). */
export function gridProgressRect(index: number): PhoneRect {
  const cover = gridCoverRect(index);
  return Object.freeze({ height: 7, width: cover.width, x: cover.x, y: cover.y + cover.height + 12 });
}

/**
 * Home carousel books, in swipe order. The design shows the blue book
 * centred (74:2080) with orange (74:2079) left and sage (74:2078) right.
 */
export const CAROUSEL_BOOKS: readonly PhoneBook[] = Object.freeze([
  book("orange", "#FD9854", "Purple Hibiscus", "Chimamanda Ngozi Adichie", 0.4, "2 September 2026"),
  book("cerulean", "#0096CC", "There Was a Country", "Chinua Achebe", 0.12, "17 September 2026"),
  book("sage", "#B2D4AD", "Half of a Yellow Sun", "Chimamanda Ngozi Adichie", 0.66, "21 August 2026"),
  book("indigo", "#2C5990", "Wayward Lives, Beautiful Experiments", "Saidiya Hartman", 0.12, "17 September 2026"),
]);
export const CAROUSEL_START_INDEX = 1;
export const CAROUSEL_CENTRE = Object.freeze({ height: 301, width: 208, x: 91, y: 245 });
/** Neighbour covers are 142 × 205 and centred 149px either side. */
export const CAROUSEL_SIDE_SCALE = 142 / 208;
export const CAROUSEL_SPACING = 149;
export const CAROUSEL_TITLE_TOP = 567;

/** Detail page cover (72:2036) and progress row (72:2037). */
export const DETAIL_COVER: PhoneRect = Object.freeze({ height: 323, width: 250, x: 70, y: 161 });
export const DETAIL_PROGRESS: PhoneRect = Object.freeze({ height: 20, width: 250, x: 70, y: 496 });
export const DETAIL_TEXT_TOP = 557;

export function rectCentre(rect: PhoneRect): Readonly<{ x: number; y: number }> {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Book thickness grows with the cover so the edge reads at every size. */
export function bookThickness(width: number): number {
  return Math.max(6, width * 0.085);
}
