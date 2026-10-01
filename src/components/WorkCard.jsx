import fs from "node:fs";
import path from "node:path";
import CardVideo from "./CardVideo";

// Runs at build time (static export). Each card looks for
// public/asset/work/<name>.mp4 (the project clip) and <name>.png (still /
// poster frame). With neither, it falls back to the plain grey frame from
// the design.
function publicFile(name) {
  return fs.existsSync(path.join(process.cwd(), "public", name)) ? `/${name}` : null;
}

export default function WorkCard({ name, alt, width }) {
  const video = publicFile(`asset/work/${name}.mp4`);
  const image = publicFile(`asset/work/${name}.png`);

  return (
    <div
      className="relative aspect-[var(--card-ratio)] w-full overflow-hidden bg-[var(--color-card-bg)] md:w-auto md:flex-[var(--card-grow)_1_0%]"
      style={{ "--card-ratio": `${width} / 271`, "--card-grow": width }}
    >
      {video ? (
        <CardVideo src={video} poster={image ?? undefined} label={alt} />
      ) : (
        image && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
          <img
            src={image}
            alt={alt}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}
    </div>
  );
}
