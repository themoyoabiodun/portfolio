// Made-up books for the shelf. Everything is derived from the index so the
// preview and export build the identical scene.
export type ShelfBook = Readonly<{
  accent: string;
  author: string;
  cover: string;
  depth: number;
  height: number;
  id: number;
  ink: string;
  ornament: 0 | 1 | 2;
  title: string;
  width: number;
}>;

const TITLES: readonly (readonly [string, string])[] = [
  ["The Quiet Harbor", "Ada Okafor"],
  ["Notes on Light", "Lena Vos"],
  ["Salt & Ember", "Tomi Bello"],
  ["A Map of Small Things", "Iris Hale"],
  ["Paper Moons", "Kemi Adeyemi"],
  ["The Long Field", "Owen March"],
  ["Glass Orchard", "Mira Chen"],
  ["Thin Air", "Jonah Reyes"],
  ["Wild Grammar", "Bisi Cole"],
  ["Northern Hours", "Sade Lawal"],
];

const PALETTE: readonly (readonly [string, string, string])[] = [
  ["#1F3A5F", "#F4E9D8", "#E3B23C"],
  ["#B5452F", "#FBEFE1", "#F2C48D"],
  ["#2F5D50", "#F1EAD9", "#D9B26F"],
  ["#E3B23C", "#2A2116", "#7A3B1D"],
  ["#6B3E75", "#F3E7F5", "#E8B4C8"],
  ["#D9D2C3", "#2B2B2B", "#B5452F"],
  ["#232323", "#F5F5F5", "#E3B23C"],
  ["#C97B84", "#FFF4F2", "#5A2A30"],
  ["#3D6E9E", "#EEF4FB", "#F4D35E"],
  ["#8A9A5B", "#1F2412", "#F1EAD9"],
];

export function makeShelfBook(id: number): ShelfBook {
  const [title, author] = TITLES[id % TITLES.length];
  const [cover, ink, accent] = PALETTE[(id * 3) % PALETTE.length];
  return Object.freeze({
    accent,
    author,
    cover,
    depth: 0.24 + ((id * 7) % 4) * 0.06,
    height: 1.9 + ((id * 37) % 5) * 0.08,
    id,
    ink,
    ornament: (id % 3) as 0 | 1 | 2,
    title,
    width: 1.32 + ((id * 13) % 3) * 0.08,
  });
}

/** Books already standing on the shelf, left to right. */
export const SHELF_BOOKS: readonly ShelfBook[] = Object.freeze(
  Array.from({ length: 9 }, (_, index) => makeShelfBook(index)),
);

/** The book that is added to the shelf on every loop. */
export const HERO_BOOK: ShelfBook = makeShelfBook(9);

export const SHELF_GAP = 0.03;
