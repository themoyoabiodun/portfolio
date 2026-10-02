import Avatar from "@/components/Avatar";
import LinkPreview from "@/components/LinkPreview";
import Nav from "@/components/Nav";
import WorkCard from "@/components/WorkCard";

// Two rows of three cards, all 164px tall, in Figma's column widths
// (183 / 232 / 233). Cards keep these proportions as the grid scales down.
const CARD_HEIGHT = 164;

const WORK = [
  { name: "budget-fix", alt: "Budget fix widget on an iPhone home screen", width: 183 },
  { name: "scroll-interaction", alt: "Anchor application review scroll interaction", width: 232 },
  { name: "rank-card", alt: "Rank “Finish setup” card", width: 233 },
  { name: "slow-animation", alt: "Selected works list animation", width: 183 },
  { name: "portfolio-mobile", alt: "Mobile portfolio on an iPhone", width: 232 },
  { name: "navigation", alt: "Anchor dashboard sidebar navigation", width: 233 },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[var(--color-bg)] px-4 pt-[42px] pb-32 md:px-[52px]">
      <Nav />

      <section
        id="about"
        className="mt-[69px] flex scroll-mt-16 flex-col items-center gap-10 text-center"
      >
        <div
          className="animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <Avatar src="/asset/headshot.png" alt="Moyo Abiodun" />
        </div>

        <p
          className="m-0 max-w-[443px] text-sm font-medium leading-[22px] text-[var(--color-text-primary)] animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          Moyo is a Product designer helping founders turn their early ideas
          into shipped products. Most of my work has been in the Fintech
          ecosystem, from payment, card, and banking infrastructure at{" "}
          <LinkPreview
            href="https://www.getanchor.co"
            url="www.getanchor.co"
            icon="/asset/icons/anchor.svg"
            color="#045137"
          >
            Anchor (YC S22)
          </LinkPreview> to savings, budgeting, and
          investment products at <LinkPreview
            href="https://www.userank.com"
            url="www.userank.com"
            icon="/asset/icons/rank.svg"
            color="#F97501"
          >
            Rank (YC W22)
          </LinkPreview>. Along
          the way, I’ve helped teams maintain and build design systems and
          product foundation crafted with excellence, needed to move quickly
          without losing consistency.
        </p>
      </section>

      <section
        id="work"
        aria-label="Selected work"
        className="mx-auto mt-20 grid max-w-[664px] scroll-mt-16 grid-cols-1 gap-2 md:grid-cols-[183fr_232fr_233fr]"
      >
        {/* Cards continue the page's 60ms entrance stagger instead of
            arriving as one block. */}
        {WORK.map((item, i) => (
          <WorkCard key={item.name} {...item} height={CARD_HEIGHT} delay={180 + i * 60} />
        ))}
      </section>
    </main>
  );
}
