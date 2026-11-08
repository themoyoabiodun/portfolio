// Made-up books for the shelf lab. Each one is derived from its id, so the
// server and the client render the same shelf.
const TITLES = [
  ["The Quiet Harbor", "Ada Okafor"],
  ["Notes on Light", "Lena Vos"],
  ["Salt & Ember", "Tomi Bello"],
  ["A Map of Small Things", "Iris Hale"],
  ["Paper Moons", "Kemi Adeyemi"],
  ["The Long Field", "Owen March"],
  ["Northern Hours", "Sade Lawal"],
  ["Glass Orchard", "Mira Chen"],
  ["Thin Air", "Jonah Reyes"],
  ["The Lantern Year", "Funmi Ade"],
  ["Field Guide to Rain", "Noor Haddad"],
  ["Copper Sky", "Eli Turner"],
  ["Wild Grammar", "Bisi Cole"],
  ["Saltwater Letters", "Ana Ruiz"],
  ["Afterimage", "Theo Lind"],
  ["The Slow Tide", "Zara Obi"],
  ["Everything Green", "Hana Mori"],
  ["Lagos at Dusk", "Dayo Ilori"],
];

const PALETTE = [
  { bg: "#1f3a5f", ink: "#f4e9d8", accent: "#e3b23c" },
  { bg: "#b5452f", ink: "#fbefe1", accent: "#f2c48d" },
  { bg: "#2f5d50", ink: "#f1ead9", accent: "#d9b26f" },
  { bg: "#e3b23c", ink: "#2a2116", accent: "#7a3b1d" },
  { bg: "#6b3e75", ink: "#f3e7f5", accent: "#e8b4c8" },
  { bg: "#d9d2c3", ink: "#2b2b2b", accent: "#b5452f" },
  { bg: "#232323", ink: "#f5f5f5", accent: "#e3b23c" },
  { bg: "#c97b84", ink: "#fff4f2", accent: "#5a2a30" },
  { bg: "#3d6e9e", ink: "#eef4fb", accent: "#f4d35e" },
  { bg: "#8a9a5b", ink: "#1f2412", accent: "#f1ead9" },
];

export function makeBook(id) {
  const [title, author] = TITLES[id % TITLES.length];
  return {
    id,
    title,
    author,
    ...PALETTE[(id * 3) % PALETTE.length],
    ornament: id % 3,
    w: 136 + ((id * 13) % 3) * 8,
    h: 196 + ((id * 37) % 5) * 8,
    d: 26 + ((id * 7) % 4) * 6,
  };
}

export const INITIAL_SHELF = [0, 1, 2, 3, 4, 5].map(makeBook);
export const FIRST_HERO_ID = INITIAL_SHELF.length;
