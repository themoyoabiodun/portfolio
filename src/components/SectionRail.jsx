"use client";

import { useEffect, useRef, useState } from "react";

// Right-edge section marker (Figma 2240:84 / 2240:86): one short bar per
// page section; the current one is darker and longer. The label pill
// points at the current bar while the page is scrolling (it fades once
// scrolling settles, like an overlay scrollbar) and at any bar under the
// pointer. Bars scroll to their section.
const SECTIONS = [
  { id: "about", label: "About" },
  { id: "work", label: "Design" },
  { id: "selected-works", label: "Selected Works" },
  { id: "contact", label: "Get in touch" },
];
const BAR_PITCH = 12; // 4px bar + 8px gap
const SCROLL_IDLE_MS = 800;

export default function SectionRail() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [scrolling, setScrolling] = useState(false);
  const idle = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = 0;
      SECTIONS.forEach(({ id }, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = i;
      });
      // At the very bottom the last section is current even if short.
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atEnd ? SECTIONS.length - 1 : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onUserScroll = () => {
      onScroll();
      setScrolling(true);
      clearTimeout(idle.current);
      idle.current = setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    };
    update();
    window.addEventListener("scroll", onUserScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idle.current);
      window.removeEventListener("scroll", onUserScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shown = hovered ?? active;
  const labelVisible = hovered !== null || scrolling;

  const goTo = (id) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="Page sections"
      className="section-rail fixed top-1/2 right-9 z-20 hidden -translate-y-1/2 min-[1100px]:block"
      onPointerLeave={() => setHovered(null)}
    >
      <span
        aria-hidden="true"
        data-visible={labelVisible ? "" : undefined}
        className="section-rail-label"
        style={{ "--rail-y": `${shown * BAR_PITCH}px` }}
      >
        <span className="section-rail-pill">{SECTIONS[shown].label}</span>
        {/* Figma's rounded triangle, turned to point at the bar. */}
        <span className="flex size-2 shrink-0 items-center justify-center">
          <svg width="5.467" height="5" viewBox="0 0 5.46709 5" className="rotate-90">
            <path
              d="M1.86752 0.5C2.25242 -0.166667 3.21467 -0.166666 3.59957 0.5L5.33162 3.5C5.71652 4.16667 5.23539 5 4.46559 5H1.00149C0.231691 5 -0.249434 4.16667 0.135467 3.5L1.86752 0.5Z"
              fill="var(--color-rail-label)"
            />
          </svg>
        </span>
      </span>
      <ul className="flex flex-col items-end">
        {SECTIONS.map(({ id, label }, i) => (
          <li key={id}>
            <button
              type="button"
              aria-label={label}
              aria-current={i === active ? "true" : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => goTo(id)}
              className="section-rail-bar flex h-3 w-[22px] items-center justify-end"
            >
              <span className="h-1 w-[22px] rounded-full" />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
