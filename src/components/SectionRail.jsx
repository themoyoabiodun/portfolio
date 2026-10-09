"use client";

import { useEffect, useRef, useState } from "react";

// Right-edge section marker (Figma 2240:84 / 2240:86): one bar per page
// section, the current one darker. Hovering a bar, or arriving at a new
// section while scrolling, shows its name in a pill pointing at the bar.
// Bars scroll to their section.
const SECTIONS = [
  { id: "about", label: "About" },
  { id: "work", label: "Design" },
  { id: "selected-works", label: "Selected Works" },
  { id: "contact", label: "Get in touch" },
];
const BAR_PITCH = 20; // 4px bar + 16px gap
const LABEL_LINGER_MS = 1200;

export default function SectionRail() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [announce, setAnnounce] = useState(false);
  const timer = useRef(null);
  const first = useRef(true);

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
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Briefly name the section the reader has just scrolled into.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnounce(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnnounce(false), LABEL_LINGER_MS);
    return () => clearTimeout(timer.current);
  }, [active]);

  const shown = hovered ?? active;
  const labelVisible = hovered !== null || announce;

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
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
          <path d="M1.5 1 L7 4 L1.5 7 Z" fill="var(--color-rail-label)" />
        </svg>
      </span>
      <ul className="flex flex-col">
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
              className="section-rail-bar group flex h-5 w-10 items-center"
            >
              <span className="h-1 w-full rounded-full" />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
