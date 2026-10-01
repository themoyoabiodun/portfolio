import fs from "node:fs";
import path from "node:path";

// Runs at build time (static export). Until a project's image is added to
// public/, the card falls back to the plain grey frame from the design.
function publicFileExists(src) {
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

export default function WorkCard({ src, alt, width }) {
  return (
    <div
      className="relative aspect-[var(--card-ratio)] w-full overflow-hidden bg-[var(--color-card-bg)] md:w-auto md:flex-[var(--card-grow)_1_0%]"
      style={{ "--card-ratio": `${width} / 271`, "--card-grow": width }}
    >
      {publicFileExists(src) && (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
        <img
          src={`/${src}`}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
