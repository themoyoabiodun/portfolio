"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useDragControls,
  useTransform,
} from "motion/react";
import { CASE_STUDIES } from "@/content/caseStudies";
import { highlight } from "@/lib/highlight";
import CardVideo from "./CardVideo";

// Drawer motion (animate skill, drawer recipe): slides in from the right on
// the iOS-like drawer curve, and leaves the way it came, faster.
const EASE_DRAWER = [0.32, 0.72, 0, 1];
const ENTER = { duration: 0.5, ease: EASE_DRAWER };
const EXIT = { duration: 0.3, ease: EASE_DRAWER };
// Animated through Motion's x value (not a transform string) so the panel
// rests at transform: none. A leftover identity transform keeps the panel
// on its own compositor layer, which renders text, bold weights especially,
// soft and grey on many screens.
const OFFSCREEN = "110%";
const ONSCREEN = 0;

// Phones get a bottom sheet instead of the side peek (iOS sheet / Vaul
// pattern): it rises from the bottom over a dimmed page and is dismissed by
// dragging its header down, tapping the backdrop or the close button.
const SHEET_QUERY = "(max-width: 639px)";
// Dismiss on distance or on a flick (animate skill, drag-to-dismiss).
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 500;

function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Title morph (Figma 2217:1186): as the large title scrolls up under the
// header, it shrinks toward the top-left and fades; the compact title then
// rises into the header. A light blur blends the two into one perceived
// change instead of two overlapping texts (animate skill, crossfade
// recipe). Scroll-linked, so it tracks the thumb and reverses for free.
// Distances are scrollTop in px and scale with the large title's height
// (32px for one line): it fades over its own height, and the compact
// title arrives from 3/4 of that height to 1.5x.
const morphOut = (h) => [0, h];
const morphIn = (h) => [h * 0.75, h * 1.5];
const TITLE_SCALE = 18 / 24; // 18px header title / 24px large title

const progress = (y, [from, to]) => Math.min(1, Math.max(0, (y - from) / (to - from)));
// "none" at rest: even blur(0px) rasterises text through a filter and
// softens it.
const blur = (px) => (px > 0.01 ? `blur(${px}px)` : "none");

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

const COPIED_MS = 1500;

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className="code-block relative">
      <pre>
        <code>
          {highlight(code, lang).map(([text, kind], i) =>
            kind ? (
              <span key={i} className={`tok-${kind}`}>
                {text}
              </span>
            ) : (
              text
            ),
          )}
        </code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        data-copied={copied ? "" : undefined}
        className="code-copy absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-[6px] text-[var(--color-drawer-muted)]"
      >
        <Icon name="copy" className="code-copy-icon" />
        <Icon name="check" className="code-copy-icon code-copy-check absolute" />
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}

// Inline runs: strings, { b } for bold and { code } for inline code.
function Inline({ text }) {
  if (typeof text === "string") return text;
  if (Array.isArray(text)) {
    return text.map((run, i) => <Inline key={i} text={run} />);
  }
  if (text.b !== undefined) {
    return (
      <strong>
        <Inline text={text.b} />
      </strong>
    );
  }
  return <code>{text.code}</code>;
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
    const List = block.ordered ? "ol" : "ul";
    return (
      <List>
        {block.list.map((item, i) => (
          <li key={i}>
            <Inline text={item} />
          </li>
        ))}
      </List>
    );
  }
  if (block.code) return <CodeBlock code={block.code} lang={block.lang} />;
  if (block.table) {
    const { head, rows } = block.table;
    return (
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Table">
        <table>
          <thead>
            <tr>
              {head.map((cell) => (
                <th key={cell} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([first, ...rest]) => (
              <tr key={first}>
                <th scope="row">
                  <Inline text={first} />
                </th>
                {rest.map((cell, i) => (
                  <td key={i}>
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p>
      <Inline text={block.p} />
    </p>
  );
}

function Drawer({ study, media, onClose }) {
  const reduce = useReducedMotion();
  const isSheet = useMediaQuery(SHEET_QUERY);
  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scrollRef = useRef(null);
  const titleId = "case-study-title";

  const titleRef = useRef(null);
  // Large title height drives the morph distances; 32px is one line.
  const titleHeight = useRef(32);
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const measure = () => {
      titleHeight.current = el.offsetHeight || 32;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollY } = useScroll({ container: scrollRef });
  const outAt = (y) => progress(y, morphOut(titleHeight.current));
  const inAt = (y) => progress(y, morphIn(titleHeight.current));
  const bigOpacity = useTransform(scrollY, (y) => 1 - outAt(y));
  const bigScale = useTransform(scrollY, (y) => 1 - (1 - TITLE_SCALE) * outAt(y));
  const bigBlur = useTransform(scrollY, (y) => blur(outAt(y) * 4));
  const smallOpacity = useTransform(scrollY, inAt);
  const smallY = useTransform(scrollY, (y) => 12 * (1 - inAt(y)));
  const smallBlur = useTransform(scrollY, (y) => blur((1 - inAt(y)) * 4));

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

  // The sheet owns the page while it's open: no scrolling behind it.
  useEffect(() => {
    if (!isSheet) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [isSheet]);

  const offscreen = isSheet ? { y: "100%" } : { x: OFFSCREEN };
  const onscreen = isSheet ? { y: 0 } : { x: ONSCREEN };
  const hidden = reduce ? { opacity: 0 } : offscreen;
  const shown = reduce ? { opacity: 1 } : onscreen;
  const canDrag = isSheet && !reduce;

  return (
    <>
      {isSheet ? (
        <motion.div
          className="fixed inset-0 z-40 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: ENTER }}
          exit={{ opacity: 0, transition: EXIT }}
          onClick={onClose}
          aria-hidden="true"
        />
      ) : (
        // Like Notion's side peek the page stays visible; clicking it closes.
        <div className="fixed inset-0 z-40" onPointerDown={onClose} aria-hidden="true" />
      )}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={hidden}
        animate={{ ...shown, transition: ENTER }}
        exit={{ ...hidden, transition: EXIT }}
        drag={canDrag ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 1 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
            onClose();
          }
        }}
        className={`case-study-drawer fixed z-50 flex flex-col overflow-hidden bg-[var(--color-drawer-bg)] text-[var(--color-text-primary)] ${
          isSheet
            ? "inset-x-0 top-[calc(env(safe-area-inset-top,0px)+40px)] bottom-0 rounded-t-[20px] shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.12)]"
            : "top-2 right-2 bottom-2 w-[min(429px,calc(100vw-16px))] rounded-[20px] shadow-[0px_8px_10px_0px_rgba(0,0,0,0.16),0px_0px_0px_1px_rgba(0,0,0,0.08)]"
        }`}
      >
        {isSheet && (
          // Grab area: the handle and header drag the sheet; the body keeps
          // native scrolling.
          <div
            aria-hidden="true"
            onPointerDown={(event) => canDrag && dragControls.start(event)}
            className="sheet-grab flex h-5 shrink-0 items-end justify-center"
          >
            <span className="h-[5px] w-9 rounded-full bg-[var(--color-drawer-muted)] opacity-40" />
          </div>
        )}
        <div
          onPointerDown={(event) => canDrag && dragControls.start(event)}
          className={`flex shrink-0 items-center gap-6 px-6 ${isSheet ? "sheet-grab h-[52px]" : "h-[60px]"}`}
        >
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
          <article
            className={`flex flex-col items-start gap-7 px-6 pt-4 ${
              isSheet ? "pb-[calc(24px+env(safe-area-inset-bottom,0px))]" : "pb-4"
            }`}
          >
            <motion.h2
              ref={titleRef}
              id={titleId}
              style={
                reduce
                  ? { opacity: bigOpacity }
                  : { opacity: bigOpacity, scale: bigScale, filter: bigBlur }
              }
              className="max-w-full origin-top-left text-2xl font-bold leading-8 tracking-[-0.48px] text-balance"
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
