import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

// Gesture-driven tilt: a spring, not a tween, so it can be interrupted and
// carries velocity as the pointer moves — see animate skill, "reach for a
// spring" for mouse-tracking.
const TILT_SPRING = { stiffness: 150, damping: 15, mass: 0.5 };
const SCALE_SPRING = { stiffness: 300, damping: 20 };
const MORPH_TRANSITION = { duration: 0.5, ease: [0.77, 0, 0.175, 1] };
const MORPH_RADIUS = "38% 62% 58% 42% / 42% 45% 55% 58%";

export default function Avatar({ src, alt }) {
  const ref = useRef(null);
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

  return (
    <div className="[perspective:600px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        initial={{ borderRadius: "50%" }}
        whileHover={prefersReducedMotion ? undefined : { borderRadius: MORPH_RADIUS }}
        transition={{ borderRadius: MORPH_TRANSITION }}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        className="h-11 w-11 cursor-pointer overflow-hidden will-change-transform"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover"
        />
      </motion.div>
    </div>
  );
}
