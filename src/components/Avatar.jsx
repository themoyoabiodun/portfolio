import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import lightboxGlow from "../assets/lightbox-backdrop.svg";

// Gesture-driven tilt: a spring, not a tween, so it can be interrupted and
// carries velocity as the pointer moves — see animate skill, "reach for a
// spring" for mouse-tracking.
const TILT_SPRING = { stiffness: 150, damping: 15, mass: 0.5 };
const SCALE_SPRING = { stiffness: 300, damping: 20 };
const HOVER_MORPH_TRANSITION = { duration: 0.5, ease: [0.77, 0, 0.175, 1] };
const HOVER_MORPH_RADIUS = "38% 62% 58% 42% / 42% 45% 55% 58%";
const CIRCLE_RADIUS = "50%";

// Shared-element expand: "Snappy Out" from easing.dev — cubic-bezier(0.19, 1,
// 0.22, 1), a zero-overshoot deceleration. Used as a *tween*, not a spring,
// and applied identically on both the small avatar and the expanded card so
// open and close read as the same motion in reverse, rather than a smooth
// tween one way and a default spring the other.
const EXPAND_EASE = [0.19, 1, 0.22, 1];
const EXPAND_TRANSITION = { type: "tween", duration: 0.5, ease: EXPAND_EASE };
const LAYOUT_TRANSITION = { layout: EXPAND_TRANSITION };
const REDUCED_LAYOUT_TRANSITION = { layout: { duration: 0 } };
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
  // Owned directly (not via whileHover) so a click mid-hover can force it
  // back to a clean circle instantly — see resetTilt below.
  const borderRadius = useMotionValue(CIRCLE_RADIUS);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), TILT_SPRING);
  const scale = useSpring(1, SCALE_SPRING);

  // The shared-element expand should always grow from the avatar's neutral,
  // untilted, perfectly circular pose. Without this, clicking mid-hover
  // could catch the tilt spring or the hover-morph blob mid-flight and bake
  // a skewed or lopsided starting shape into the shared transition.
  function resetTilt() {
    mouseX.jump(0);
    mouseY.jump(0);
    rotateX.jump(0);
    rotateY.jump(0);
    scale.jump(1);
    borderRadius.jump(CIRCLE_RADIUS);
  }

  function handleMouseMove(event) {
    if (prefersReducedMotion || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleEnter() {
    if (prefersReducedMotion) return;
    scale.set(1.08);
    animate(borderRadius, HOVER_MORPH_RADIUS, HOVER_MORPH_TRANSITION);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    animate(borderRadius, CIRCLE_RADIUS, HOVER_MORPH_TRANSITION);
  }

  function openLightbox() {
    resetTilt();
    setIsOpen(true);
  }

  function closeLightbox() {
    resetTilt();
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") closeLightbox();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      <div className="[perspective:600px]">
        {!isOpen && (
          <motion.button
            type="button"
            aria-label={`View larger photo of ${alt}`}
            onClick={openLightbox}
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            layoutId={LAYOUT_ID}
            transition={prefersReducedMotion ? REDUCED_LAYOUT_TRANSITION : LAYOUT_TRANSITION}
            style={{
              borderRadius,
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
                backgroundColor: "#232c24",
                backgroundImage: `url(${lightboxGlow})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`${alt} — enlarged photo`}
              onClick={closeLightbox}
            >
              <motion.div
                layoutId={LAYOUT_ID}
                transition={prefersReducedMotion ? REDUCED_LAYOUT_TRANSITION : LAYOUT_TRANSITION}
                style={{ borderRadius: 266, aspectRatio: "346 / 380", width: "min(346px, 82vw)" }}
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
                onClick={closeLightbox}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{
                  ...CLOSE_BUTTON_TRANSITION,
                  delay: prefersReducedMotion ? 0 : 0.15,
                }}
                className="close-pill flex h-8 cursor-pointer items-center rounded-full border-0 bg-white/30 px-3.5 py-0.5 text-sm font-semibold tracking-[0.1px] text-white"
              >
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
