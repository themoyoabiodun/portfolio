import { CaseStudyButton } from "./CaseStudyDrawer";
import CardVideo from "./CardVideo";
import { workMedia } from "@/lib/publicFile";

// Each card looks for public/asset/work/<name>.mp4 (the project clip) and
// <name>.png (still / poster frame); with neither it shows the plain grey
// frame from the design. Cards with a case study open it in the drawer.
export default function WorkCard({ name, alt, width, height, delay }) {
  const { video, image } = workMedia(name);

  return (
    <div
      className="work-card relative isolate aspect-[var(--card-ratio)] w-full overflow-hidden rounded-[4px] bg-[var(--color-card-bg)] animate-fade-in-up motion-reduce:animate-fade-in"
      style={{
        "--card-ratio": `${width} / ${height}`,
        animationDelay: `${delay}ms`,
      }}
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
            className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
          />
        )
      )}
      <CaseStudyButton name={name} label={alt} />
    </div>
  );
}
