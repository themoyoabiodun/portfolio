import Avatar from "@/components/Avatar";
import Nav from "@/components/Nav";
import WorkCard from "@/components/WorkCard";

// Widths are the Figma frame widths (all 271px tall); cards keep these
// proportions as the row scales down.
const WORK = [
  { src: "asset/work/budget-fix.png", alt: "Budget fix widget on an iPhone home screen", width: 366 },
  { src: "asset/work/scroll-interaction.png", alt: "Anchor application review scroll interaction", width: 465 },
  { src: "asset/work/rank-card.png", alt: "Rank “Finish setup” card", width: 465 },
];

function Highlight({ children }) {
  return (
    <span className="underline decoration-dotted decoration-[10%] [text-decoration-skip-ink:none]">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pt-[54px] pb-32 md:px-[52px]">
      <Nav />

      <section
        id="about"
        className="mt-[111px] flex flex-col items-center gap-[41px] text-center"
      >
        <div
          className="animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <Avatar src="/asset/moyo.png" alt="Moyo Abiodun" />
        </div>

        <p
          className="m-0 max-w-[443px] text-base font-medium leading-6 text-[var(--color-text-primary)] animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          Moyo is a Snr. product designer helping founders turn their early
          ideas into shipped products. Most of my work has been in the Fintech
          ecosystem from payment, card and banking infrastructure at{" "}
          <Highlight>Anchor (YC S22)</Highlight> to savings, budgeting, and
          investment products at <Highlight>Rank (YC W22)</Highlight>. Along
          the way, I’ve helped teams maintain and build design systems and
          product foundation crafted with excellence, needed to move quickly
          without losing consistency.
        </p>
      </section>

      <section
        id="work"
        aria-label="Selected work"
        className="mx-auto mt-[101px] flex max-w-[1336px] flex-col gap-5 animate-fade-in-up motion-reduce:animate-fade-in md:flex-row md:items-center"
        style={{ animationDelay: "180ms" }}
      >
        {WORK.map((item) => (
          <WorkCard key={item.src} {...item} />
        ))}
      </section>
    </main>
  );
}
