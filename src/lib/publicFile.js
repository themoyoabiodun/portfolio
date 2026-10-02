import fs from "node:fs";
import path from "node:path";

// Build time (server only): the public URL of a file in public/, or null if
// it doesn't exist.
export function publicFile(name) {
  return fs.existsSync(path.join(process.cwd(), "public", name)) ? `/${name}` : null;
}

export function workMedia(name) {
  return {
    video: publicFile(`asset/work/${name}.mp4`),
    image: publicFile(`asset/work/${name}.png`),
  };
}
