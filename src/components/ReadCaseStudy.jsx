"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { tapHaptic } from "@/lib/haptics";
import { useCaseStudy } from "./CaseStudyDrawer";

const MESSAGE = "...this case study is almost done, check back soon";
const MESSAGE_MS = 3200;
// The button reshapes like a spring, but without bounce: it is text, and a
// wobbling width reads as jitter.
const RESIZE = { type: "spring", duration: 0.45, bounce: 0 };

function HandIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static asset
    <img
      src="/asset/icons/hand.svg"
      alt=""
      width={16}
      height={16}
      className="block size-4"
    />
  );
}

// "Read Case Study" opens the case study when one exists. Until then a press
// answers instead of doing nothing: the button widens into a note that it
// is almost done (Figma 2272:43030), then settles back.
export default function ReadCaseStudy({ caseStudy }) {
  const ctx = useCaseStudy();
  const available = caseStudy && ctx?.has(caseStudy);
  const reduceMotion = useReducedMotion();
  const [notice, setNotice] = useState(false);
  // Restarts the wave on repeat presses while the note is showing.
  const [presses, setPresses] = useState(0);
  const contentRef = useRef(null);
  const [size, setSize] = useState(null);

  // Track the label's size so the button can animate to it. On narrow
  // screens the note wraps to two lines, so height follows too.
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const measure = () =>
      setSize({ width: node.offsetWidth, height: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(false), MESSAGE_MS);
    return () => clearTimeout(id);
  }, [notice, presses]);

  const onClick = () => {
    if (available) {
      ctx.open(caseStudy);
      return;
    }
    tapHaptic();
    setNotice(true);
    setPresses((n) => n + 1);
  };

  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.23, 1, 0.32, 1] };

  return (
    <>
      <motion.button
        type="button"
        onClick={onClick}
        animate={size ?? undefined}
        initial={false}
        transition={reduceMotion ? { duration: 0 } : RESIZE}
        data-notice={notice ? "" : undefined}
        className="read-case-study relative inline-flex items-start overflow-hidden rounded-[6px] bg-[var(--color-text-primary)] text-left text-sm font-medium leading-[21px] text-white"
      >
        <span
          ref={contentRef}
          className={`flex w-max max-w-[calc(100vw-32px)] shrink-0 items-center py-[5.5px] ${notice ? "pr-3 pl-2" : "px-3"}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {notice ? (
              <motion.span
                key="notice"
                initial={{ opacity: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: "blur(2px)",
                  transition: { duration: 0.12 },
                }}
                transition={fade}
                className="flex items-center gap-2"
              >
                <motion.span
                  key={presses}
                  className="block origin-[60%_90%]"
                  initial={{ rotate: 0 }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { rotate: [0, 16, -8, 14, -4, 0] }
                  }
                  transition={{ duration: 0.9, ease: "easeInOut", delay: 0.08 }}
                >
                  <HandIcon />
                </motion.span>
                {MESSAGE}
              </motion.span>
            ) : (
              <motion.span
                key="label"
                initial={{ opacity: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: "blur(2px)",
                  transition: { duration: 0.12 },
                }}
                transition={fade}
              >
                <span className="whitespace-nowrap">Read Case Study</span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
      {/* Announce the note to screen readers; the visual swap alone is not. */}
      <span className="sr-only" aria-live="polite">
        {notice ? MESSAGE : ""}
      </span>
    </>
  );
}
