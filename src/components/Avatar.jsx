import { useRef } from "react";
import {
  animate,
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
const HOVER_MORPH_TRANSITION = { duration: 0.5, ease: [0.77, 0, 0.175, 1] };
const HOVER_MORPH_RADIUS = "38% 62% 58% 42% / 42% 45% 55% 58%";
const CIRCLE_RADIUS = "50%";

// Touch devices synthesize mouseenter/mousemove on tap, with no matching
// mouseleave — without this guard the avatar can get stuck mid-tilt after
// a tap until the user taps elsewhere.
function canHover() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

export default function Avatar({ src, alt }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const borderRadius = useMotionValue(CIRCLE_RADIUS);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), TILT_SPRING);
  const scale = useSpring(1, SCALE_SPRING);

  function handleMouseMove(event) {
    if (prefersReducedMotion || !ref.current || !canHover()) return;
    const bounds = ref.current.getBoundingClientRect();
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleEnter() {
    if (prefersReducedMotion || !canHover()) return;
    scale.set(1.08);
    animate(borderRadius, HOVER_MORPH_RADIUS, HOVER_MORPH_TRANSITION);
  }

  function handleLeave() {
    if (!canHover()) return;
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    animate(borderRadius, CIRCLE_RADIUS, HOVER_MORPH_TRANSITION);
  }

  return (
    <div className="[perspective:600px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          borderRadius,
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        className="h-11 w-11 overflow-hidden will-change-transform"
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
