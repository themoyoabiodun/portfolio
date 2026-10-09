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
import CardVideo, { holdCardVideos } from "./CardVideo";

// Drawer motion (animate skill, drawer recipe): slides in from the right on
// the iOS-like drawer curve, and leaves the way it came, faster.
const EASE_DRAWER = [0.32, 0.72, 0, 1];
const ENTER = { duration: 0.5, ease: EASE_DRAWER };
const EXIT = { duration: 0.3, ease: EASE_DRAWER };
// The side panel slides with a full transform string, which Motion runs as
// a hardware-accelerated animation (its x/y shorthands run on the main
// thread). Once it settles the transform is cleared: a leftover identity
// transform keeps the panel on its own compositor layer, which renders
// text, bold weights especially, soft and grey on many screens.
const OFFSCREEN = "translateX(110%)";
const ONSCREEN = "translateX(0%)";

// Phones get a bottom sheet instead of the side peek (iOS sheet / Vaul
// pattern): it rises from the bottom over a dimmed page and is dismissed by
// dragging its header down, tapping the backdrop or the close button.
const SHEET_QUERY = "(max-width: 639px)";
// Dismiss on distance or on a flick (animate skill, drag-to-dismiss).
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 500;

// Expand/collapse (Figma 2231:1493): the side panel grows into a window
// that fills the viewport less a 24px margin, and back. Width and insets
// animate on the same drawer curve the panel slides in on.
const RESIZE = { duration: 0.45, ease: EASE_DRAWER };
const PANEL_INSET = 12;
const EXPANDED_INSET = 24;
const PANEL_WIDTH = 429;

function panelGeometry(expanded, viewportWidth) {
  const inset = expanded ? EXPANDED_INSET : PANEL_INSET;
  const width = expanded
    ? viewportWidth - EXPANDED_INSET * 2
    : Math.min(PANEL_WIDTH, viewportWidth - PANEL_INSET * 2);
  return { top: inset, bottom: inset, right: inset, width };
}

// Width of the area fixed elements are laid out in. Measured from the
// full-screen backdrop rather than window.innerWidth, which also counts
// the reserved scrollbar gutter.
function useFixedAreaWidth(ref) {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : document.documentElement.clientWidth,
  );
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

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
  // Remembered across case studies for the visit, like a window size.
  const [expanded, setExpanded] = useState(false);
  const returnFocus = useRef(null);

  const open = useCallback((name) => {
    if (!CASE_STUDIES[name]) return;
    returnFocus.current = document.activeElement;
    setOpenName(name);
  }, []);

  const close = useCallback(() => setOpenName(null), []);

  // The cards sit under the dimmed backdrop while a case study is open;
  // pausing them frees the decoder for the drawer's own video.
  useEffect(() => {
    holdCardVideos(openName !== null);
  }, [openName]);

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
            expanded={expanded}
            onToggleExpanded={() => setExpanded((value) => !value)}
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

// Tooltip timing (animate skill, tooltip recipe): a short hover delay so
// tooltips don't flash as the pointer passes, then neighbours open
// instantly, without the animation, while one has just been shown.
const TOOLTIP_DELAY_MS = 400;
const TOOLTIP_INSTANT_WINDOW_MS = 400;
let lastTooltipClosedAt = 0;

// Icon button with a hover/keyboard tooltip above it (Figma 2231:1802).
function ActionButton({ label, onClick, buttonRef, className = "", children }) {
  const [tip, setTip] = useState(null); // null | "open" | "instant"
  const isOpen = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const open = (mode) => {
    isOpen.current = true;
    setTip(mode);
  };
  const show = (immediate) => {
    clearTimeout(timer.current);
    if (Date.now() - lastTooltipClosedAt < TOOLTIP_INSTANT_WINDOW_MS) {
      open("instant");
    } else if (immediate) {
      open("open");
    } else {
      timer.current = setTimeout(() => open("open"), TOOLTIP_DELAY_MS);
    }
  };
  const hide = () => {
    clearTimeout(timer.current);
    // Recorded synchronously so a neighbour entered in the same pointer
    // move sees it.
    if (isOpen.current) lastTooltipClosedAt = Date.now();
    isOpen.current = false;
    setTip(null);
  };

  return (
    <span className="relative flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        onClick={() => {
          hide();
          onClick();
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && show(false)}
        onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && show(true)}
        onBlur={hide}
        className={`drawer-action flex size-7 shrink-0 items-center justify-center rounded-full ${className}`}
      >
        {children}
      </button>
      <span
        aria-hidden="true"
        data-open={tip ? "" : undefined}
        data-instant={tip === "instant" ? "" : undefined}
        className="drawer-tooltip"
      >
        {label}
      </span>
    </span>
  );
}

// Maximise ↔ minimise as one icon. Drawn in the minimise orientation
// (corners top-left and bottom-right); maximise is the same strokes pushed
// out to the edges with diagonals, shown rotated a quarter turn. Toggling
// turns the icon while the corners slide in or out, so it reads as the
// same object changing state rather than a swap.
const EXPAND_PATHS = {
  max: {
    a: "M2.5 6.833 L2.5 2.5 Q2.5 2.5 2.5 2.5 L6.833 2.5",
    b: "M13.5 9.167 L13.5 13.5 Q13.5 13.5 13.5 13.5 L9.167 13.5",
    c: "M3.016 3.016 L6.833 6.833",
    d: "M12.984 12.984 L9.167 9.167",
  },
  min: {
    a: "M3.833 7.5 L3.833 5.167 Q3.833 3.833 5.167 3.833 L7.5 3.833",
    b: "M12.167 8.5 L12.167 10.833 Q12.167 12.167 10.833 12.167 L8.5 12.167",
    c: "M3.833 3.833 L3.833 3.833",
    d: "M12.167 12.167 L12.167 12.167",
  },
};
const ICON_MORPH = { type: "spring", duration: 0.4, bounce: 0 };

function ExpandIcon({ expanded, reduce }) {
  const paths = expanded ? EXPAND_PATHS.min : EXPAND_PATHS.max;
  const transition = reduce ? { duration: 0 } : ICON_MORPH;
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      initial={false}
      animate={{ rotate: expanded ? 0 : 90 }}
      transition={transition}
    >
      {["a", "b"].map((key) => (
        <motion.path key={key} initial={false} animate={{ d: paths[key] }} transition={transition} />
      ))}
      {["c", "d"].map((key) => (
        <motion.path
          key={key}
          initial={false}
          animate={{ d: paths[key], opacity: expanded ? 0 : 1 }}
          transition={transition}
        />
      ))}
    </motion.svg>
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

function Drawer({ study, media, onClose, expanded, onToggleExpanded }) {
  const reduce = useReducedMotion();
  const isSheet = useMediaQuery(SHEET_QUERY);
  const scrimRef = useRef(null);
  const viewportWidth = useFixedAreaWidth(scrimRef);
  const geometry = isSheet ? {} : panelGeometry(expanded, viewportWidth);
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

  // The drawer owns the page while it's open: no scrolling behind it.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // The sheet keeps Motion's y value: its drag gesture drives the same value.
  const offscreen = isSheet ? { y: "100%" } : { transform: OFFSCREEN };
  const onscreen = isSheet ? { y: 0 } : { transform: ONSCREEN };
  const hidden = reduce ? { opacity: 0 } : offscreen;
  const shown = reduce ? { opacity: 1 } : onscreen;
  const canDrag = isSheet && !reduce;

  return (
    <>
      <motion.div
        ref={scrimRef}
        className="fixed inset-0 z-40 bg-[var(--color-drawer-scrim)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: ENTER }}
        exit={{ opacity: 0, transition: EXIT }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        // Panel and sheet are different layouts; crossing the breakpoint
        // while open remounts the panel so no desktop sizing lingers.
        key={isSheet ? "sheet" : "panel"}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ ...hidden, ...geometry }}
        animate={{
          ...shown,
          ...geometry,
          transition: reduce
            ? { duration: 0 }
            : { default: RESIZE, transform: ENTER, y: ENTER, opacity: ENTER },
        }}
        exit={{ ...hidden, transition: EXIT }}
        drag={canDrag ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 1 }}
        onAnimationComplete={() => {
          // A frame later, so Motion's final write has landed first.
          requestAnimationFrame(() => {
            if (!isSheet && !reduce && panelRef.current) {
              panelRef.current.style.transform = "none";
            }
          });
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
            onClose();
          }
        }}
        className={`case-study-drawer fixed z-50 flex flex-col bg-[var(--color-drawer-bg)] text-[var(--color-text-primary)] ${
          isSheet
            ? "inset-x-0 top-[calc(env(safe-area-inset-top,0px)+40px)] bottom-0 overflow-hidden rounded-t-[20px] shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.12)]"
            : // Not overflow-hidden: tooltips sit above the header, outside
              // the panel. The scroll area clips its own corners.
              "rounded-[20px] shadow-[0px_8px_10px_0px_rgba(0,0,0,0.16),0px_0px_0px_1px_rgba(0,0,0,0.08)]"
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
          // The compact title starts where the body text does: 24px in the
          // side panel, and at the centred 470px reading column when
          // maximised. Padding percentages follow the panel's width, so it
          // tracks the resize animation.
          className={`flex shrink-0 items-center gap-6 pr-6 pl-[max(24px,calc((100%-470px)/2))] ${isSheet ? "sheet-grab h-[52px]" : "h-[60px]"}`}
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
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {!isSheet && (
              <ActionButton
                label={expanded ? "Minimise" : "Maximise"}
                onClick={onToggleExpanded}
              >
                <ExpandIcon expanded={expanded} reduce={reduce} />
              </ActionButton>
            )}
            <ActionButton
              label="Close"
              onClick={onClose}
              buttonRef={closeRef}
              // Touch has no hover state, so the sheet's close button keeps
              // a visible fill.
              className={isSheet ? "bg-[var(--color-drawer-button)]" : ""}
            >
              <Icon name="close" />
            </ActionButton>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={`relative flex-1 overflow-y-auto overscroll-contain ${isSheet ? "" : "rounded-b-[20px]"}`}
        >
          {/* Expanded, the text keeps a 470px reading column (Figma). */}
          <article
            className={`mx-auto flex w-full max-w-[518px] flex-col items-start gap-7 px-6 pt-4 ${
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
              <div className="relative isolate aspect-[381/287] w-full max-w-[383px] overflow-hidden rounded-[9.5px] bg-[var(--color-card-bg)]">
                {media.video ? (
                  <CardVideo
                    src={media.video}
                    poster={media.image ?? undefined}
                    label={study.title}
                    standalone
                  />
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
