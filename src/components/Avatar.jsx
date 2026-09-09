import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import closeIcon from "../assets/close-icon.svg";
import lightboxGlow from "../assets/lightbox-backdrop.svg";

// Gesture-driven tilt: a spring, not a tween, so it can be interrupted and
// carries velocity as the pointer moves — see animate skill, "reach for a
// spring" for mouse-tracking.
const TILT_SPRING = { stiffness: 150, damping: 15, mass: 0.5 };
const SCALE_SPRING = { stiffness: 300, damping: 20 };
const HOVER_MORPH_TRANSITION = { duration: 0.5, ease: [0.77, 0, 0.175, 1] };
const HOVER_MORPH_RADIUS = "38% 62% 58% 42% / 42% 45% 55% 58%";

// Shared-element expand: also a layout animation, so also a spring —
// Apple-style config (duration + bounce) is easier to reason about than
// raw physics, and a low bounce keeps a modal-open feeling controlled.
const EXPAND_SPRING = { type: "spring", duration: 0.5, bounce: 0.15 };
const BACKDROP_TRANSITION = { duration: 0.3, ease: [0.23, 1, 0.32, 1] };
const CLOSE_BUTTON_TRANSITION = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const LAYOUT_ID = "avatar-photo";

export default function Avatar({ src, fullSrc, alt }) {
  const ref = useRef(null);
  const closeButtonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), TILT_SPRING);
  const scale = useSpring(1, SCALE_SPRING);

  function handleMouseMove(event) {
    if (prefersReducedMotion || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleEnter() {
    if (prefersReducedMotion) return;
    scale.set(1.08);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="[perspective:600px]">
        {!isOpen && (
          <motion.button
            type="button"
            aria-label={`View larger photo of ${alt}`}
            onClick={() => setIsOpen(true)}
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            layoutId={LAYOUT_ID}
            initial={{ borderRadius: "50%" }}
            whileHover={prefersReducedMotion ? undefined : { borderRadius: HOVER_MORPH_RADIUS }}
            transition={{ borderRadius: HOVER_MORPH_TRANSITION }}
            style={{
              rotateX: prefersReducedMotion ? 0 : rotateX,
              rotateY: prefersReducedMotion ? 0 : rotateY,
              scale,
              transformStyle: "preserve-3d",
            }}
            className="h-11 w-11 cursor-pointer overflow-hidden border-0 bg-transparent p-0 will-change-transform"
          >
            <motion.img
              layout
              src={src}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          </motion.button>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              style={{
                backgroundColor: "#52af5a",
                backgroundImage: `url(${lightboxGlow})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`${alt} — enlarged photo`}
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                layoutId={LAYOUT_ID}
                transition={{ layout: prefersReducedMotion ? { duration: 0 } : EXPAND_SPRING }}
                style={{ borderRadius: 16, aspectRatio: "406 / 447", width: "min(406px, 82vw)" }}
                className="overflow-hidden bg-white shadow-[0_8px_16px_0_rgba(0,0,0,0.16)]"
                onClick={(event) => event.stopPropagation()}
              >
                <motion.img
                  layout
                  src={fullSrc}
                  alt={alt}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              <motion.button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{
                  ...CLOSE_BUTTON_TRANSITION,
                  delay: prefersReducedMotion ? 0 : 0.15,
                }}
                className="flex h-8 cursor-pointer items-center gap-1 rounded-full border-0 bg-white/50 px-3.5 py-0.5 text-sm font-semibold tracking-[0.1px] text-white"
              >
                <img src={closeIcon} alt="" className="h-4 w-4" />
                Close
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
