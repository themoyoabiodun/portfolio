"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { CASE_STUDIES } from "@/content/caseStudies";
import CardVideo from "./CardVideo";

// Drawer motion (animate skill, drawer recipe): slides in from the right on
// the iOS-like drawer curve, and leaves the way it came, faster.
const EASE_DRAWER = [0.32, 0.72, 0, 1];
const ENTER = { duration: 0.5, ease: EASE_DRAWER };
const EXIT = { duration: 0.3, ease: EASE_DRAWER };
const OFFSCREEN = "translateX(110%)";
const ONSCREEN = "translateX(0%)";

// Title morph (Figma 2217:1186): as the large title scrolls up under the
// header, it shrinks toward the top-left and fades; the compact title then
// rises into the header. A light blur blends the two into one perceived
// change instead of two overlapping texts (animate skill, crossfade
// recipe). Scroll-linked, so it tracks the thumb and reverses for free.
// Distances are scrollTop in px: the one-line large title spans 16-48px.
const MORPH_OUT = [0, 32];
const MORPH_IN = [24, 48];
const TITLE_SCALE = 18 / 24; // 18px header title / 24px large title

const CaseStudyContext = createContext(null);

export function useCaseStudy() {
  return useContext(CaseStudyContext);
}

// Wraps the work grid: owns which case study is open and renders the drawer.
// `media` maps card names to their { video, image } public URLs.
export function CaseStudyProvider({ media, children }) {
  const [openName, setOpenName] = useState(null);
  const returnFocus = useRef(null);

  const open = useCallback((name) => {
    if (!CASE_STUDIES[name]) return;
    returnFocus.current = document.activeElement;
    setOpenName(name);
  }, []);

  const close = useCallback(() => setOpenName(null), []);

  return (
    <CaseStudyContext.Provider value={{ open, has: (name) => !!CASE_STUDIES[name] }}>
      {children}
      <AnimatePresence
        onExitComplete={() => {
          returnFocus.current?.focus?.({ preventScroll: true });
          returnFocus.current = null;
        }}
      >
        {openName && (
          <Drawer
            key={openName}
            study={CASE_STUDIES[openName]}
            media={media?.[openName]}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </CaseStudyContext.Provider>
  );
}

// Invisible full-card button: the whole card opens its case study.
export function CaseStudyButton({ name, label }) {
  const ctx = useCaseStudy();
  if (!ctx?.has(name)) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`Open case study: ${label}`}
      onClick={() => ctx.open(name)}
      className="case-study-button absolute inset-0 z-10 cursor-pointer rounded-[inherit]"
    />
  );
}

function Icon({ name, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 shrink-0 bg-current ${className}`}
      style={{
        mask: `url(/asset/icons/${name}.svg) center / contain no-repeat`,
        WebkitMask: `url(/asset/icons/${name}.svg) center / contain no-repeat`,
      }}
    />
  );
}

// Body blocks render as plain semantic elements; spacing and type come from
// .case-study-prose in globals.css so the rhythm lives in one place.
function Block({ block }) {
  if (Array.isArray(block)) {
    return block.map((b, i) => <Block key={i} block={b} />);
  }
  if (block.h2) return <h3>{block.h2}</h3>;
  if (block.h3) return <h4>{block.h3}</h4>;
  if (block.list) {
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.code) {
    return (
      <pre>
        <code>{block.code}</code>
      </pre>
    );
  }
  return <p>{block.p}</p>;
}

function Drawer({ study, media, onClose }) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scrollRef = useRef(null);
  const titleId = "case-study-title";

  const { scrollY } = useScroll({ container: scrollRef });
  const bigOpacity = useTransform(scrollY, MORPH_OUT, [1, 0]);
  const bigScale = useTransform(scrollY, MORPH_OUT, [1, TITLE_SCALE]);
  const bigBlur = useTransform(scrollY, MORPH_OUT, ["blur(0px)", "blur(4px)"]);
  const smallOpacity = useTransform(scrollY, MORPH_IN, [0, 1]);
  const smallY = useTransform(scrollY, MORPH_IN, [12, 0]);
  const smallBlur = useTransform(scrollY, MORPH_IN, ["blur(4px)", "blur(0px)"]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      // Keep keyboard focus inside the drawer while it's open.
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const hidden = reduce ? { opacity: 0 } : { transform: OFFSCREEN };
  const shown = reduce ? { opacity: 1 } : { transform: ONSCREEN };

  return (
    <>
      {/* Like Notion's side peek the page stays visible; clicking it closes. */}
      <div className="fixed inset-0 z-40" onPointerDown={onClose} aria-hidden="true" />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={hidden}
        animate={{ ...shown, transition: ENTER }}
        exit={{ ...hidden, transition: EXIT }}
        className="case-study-drawer fixed top-2 right-2 bottom-2 z-50 flex w-[min(429px,calc(100vw-16px))] flex-col overflow-hidden rounded-[20px] bg-[var(--color-drawer-bg)] text-[var(--color-text-primary)] shadow-[0px_8px_10px_0px_rgba(0,0,0,0.16),0px_0px_0px_1px_rgba(0,0,0,0.08)]"
      >
        <div className="flex h-[60px] shrink-0 items-center gap-6 px-6">
          {/* Decorative copy of the title; the h2 below stays the label. */}
          <motion.p
            aria-hidden="true"
            style={
              reduce
                ? { opacity: smallOpacity }
                : { opacity: smallOpacity, y: smallY, filter: smallBlur }
            }
            className="min-w-0 flex-1 truncate text-lg font-bold leading-8 tracking-[-0.36px]"
          >
            {study.title}
          </motion.p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="drawer-close ml-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-drawer-button)]"
          >
            <Icon name="close" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto overscroll-contain"
        >
          <article className="flex flex-col items-start gap-7 px-6 py-4">
            <motion.h2
              id={titleId}
              style={
                reduce
                  ? { opacity: bigOpacity }
                  : { opacity: bigOpacity, scale: bigScale, filter: bigBlur }
              }
              className="max-w-full origin-top-left text-2xl font-bold leading-8 tracking-[-0.48px]"
            >
              {study.title}
            </motion.h2>

            <dl className="grid w-full grid-cols-[119px_1fr] gap-x-4 gap-y-2 text-[13px] font-medium leading-[19px]">
              {study.meta.map(({ icon, label, value, href }) => (
                <div key={label} className="contents">
                  <dt className="flex items-center gap-2 text-[var(--color-drawer-muted)]">
                    <Icon name={icon} />
                    {label}
                  </dt>
                  <dd>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="drawer-link dotted-underline"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {media && (media.video || media.image) && (
              <div className="relative isolate aspect-[381/287] w-full overflow-hidden rounded-[9.5px] bg-[var(--color-card-bg)]">
                {media.video ? (
                  <CardVideo src={media.video} poster={media.image ?? undefined} label={study.title} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- static image
                  <img
                    src={media.image}
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
                  />
                )}
              </div>
            )}

            <div className="case-study-prose w-full">
              {study.sections.map((section, i) => (
                <section key={i}>
                  <Block block={section} />
                </section>
              ))}
            </div>
          </article>
        </div>
      </motion.div>
    </>
  );
}
