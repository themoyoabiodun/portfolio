import Avatar from "@/components/Avatar";
import CopyEmail from "@/components/CopyEmail";
import { CaseStudyProvider } from "@/components/CaseStudyDrawer";
import LinkPreview from "@/components/LinkPreview";
import Nav from "@/components/Nav";
import SectionRail from "@/components/SectionRail";
import SelectedWorks from "@/components/SelectedWorks";
import WorkCard from "@/components/WorkCard";
import { workMedia } from "@/lib/publicFile";

// Two rows of three cards, all 164px tall, in Figma's column widths
// (185 / 232 / 233). Cards keep these proportions as the grid scales down.
const CARD_HEIGHT = 164;

const WORK = [
  { name: "budget-fix", alt: "Budget fix widget on an iPhone home screen", width: 185 },
  { name: "scroll-interaction", alt: "Anchor application review scroll interaction", width: 232 },
  { name: "rank-card", alt: "Rank “Finish setup” card", width: 233 },
  { name: "slow-animation", alt: "Selected works list animation", width: 185 },
  { name: "portfolio-mobile", alt: "Mobile portfolio on an iPhone", width: 232 },
  { name: "navigation", alt: "Anchor dashboard sidebar navigation", width: 233 },
];

const EXPERIENCE = [
  { name: "Rank", logo: "/asset/experience/rank.svg" },
  { name: "Anchor", logo: "/asset/experience/anchor.svg" },
  { name: "Previous company", logo: "/asset/experience/company-yellow.png" },
  { name: "GoSource", logo: "/asset/experience/gosource.png", inset: true },
  { name: "Pocket", logo: "/asset/experience/pocket.png" },
  { name: "The Novel Brand", logo: "/asset/experience/the-novel-brand.png" },
];

const CONTACT = [
  { label: "linkedin.com/in/moyo99", href: "https://www.linkedin.com/in/moyo99" },
  { label: "x.com/themoyoabiodun", href: "https://x.com/themoyoabiodun" },
];

const EMAIL = "themoyoabiodun@gmail.com";

export default function Home() {
  const media = Object.fromEntries(WORK.map(({ name }) => [name, workMedia(name)]));

  return (
    // One 666px column (Figma 2175:1277): nav, intro, work and footer,
    // left-aligned and 80px apart, starting 34px from the top.
    <main className="min-h-svh overflow-x-clip bg-[var(--color-bg)] px-4 pt-[22px] pb-32 md:px-[52px]">
      <Nav />
      <SectionRail />

      <section
        id="about"
        className="mx-auto mt-[68px] flex max-w-[666px] scroll-mt-16 flex-col items-start gap-10"
      >
        <div
          className="flex flex-col items-start gap-4 animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <Avatar src="/asset/headshot.png" alt="Michael Moyo Abiodun" />
          <div className="flex flex-col gap-1 font-medium">
            <h1 className="text-sm leading-[22px] text-[var(--color-text-primary)]">
              Michael Moyo Abiodun
            </h1>
            <p className="text-[13px] leading-[19px] text-[var(--color-text-muted)]">
              Product designer, Lagos Nigeria
            </p>
          </div>
        </div>

        <p
          className="m-0 text-sm font-medium leading-6 text-[var(--color-text-primary)] animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          Over the years, I’ve been helping founders turn their early ideas
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

      <CaseStudyProvider media={media}>
        <section
          id="work"
          aria-label="Selected work"
          className="mx-auto mt-20 grid max-w-[666px] scroll-mt-16 grid-cols-1 gap-2 md:grid-cols-[185fr_232fr_233fr]"
        >
          {/* Cards continue the page's 60ms entrance stagger instead of
              arriving as one block. */}
          {WORK.map((item, i) => (
            <WorkCard key={item.name} {...item} height={CARD_HEIGHT} delay={180 + i * 60} />
          ))}
        </section>

        <SelectedWorks />
      </CaseStudyProvider>

      <footer
        id="contact"
        className="mx-auto mt-20 flex max-w-[666px] flex-col gap-10 text-sm font-medium leading-[22px] animate-fade-in-up motion-reduce:animate-fade-in sm:flex-row sm:items-start sm:justify-between"
        style={{ animationDelay: "540ms" }}
      >
        <section aria-labelledby="experience-heading" className="flex flex-col gap-4">
          <h2 id="experience-heading" className="text-[var(--color-text-muted)]">
            Experience
          </h2>
          <ul className="flex items-center gap-4">
            {EXPERIENCE.map(({ name, logo, inset }) => (
              <li
                key={name}
                className="flex size-7 items-center justify-center overflow-hidden rounded-[8px] bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
                <img
                  src={logo}
                  alt={name}
                  title={name}
                  width={inset ? 18 : 28}
                  height={inset ? 18 : 28}
                  className={inset ? "size-[18px]" : "size-7"}
                />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contact-heading" className="flex w-[220px] flex-col gap-4">
          <h2 id="contact-heading" className="text-[var(--color-text-muted)]">
            Get in touch
          </h2>
          <ul className="flex flex-col items-start gap-2 text-[var(--color-text-primary)]">
            {CONTACT.map(({ label, href }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="dotted-underline">
                  {label}
                </a>
              </li>
            ))}
            <li>
              <CopyEmail email={EMAIL} />
            </li>
          </ul>
        </section>
      </footer>
    </main>
  );
}
