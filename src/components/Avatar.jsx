"use client";

import { useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

// Decorative mouse-tracking: a spring, not a tween, so it can be interrupted
// and carries velocity as the pointer moves. Apple-style config from the
// animate skill (0.5s, bounce 0.2).
const SPRING = { visualDuration: 0.5, bounce: 0.2 };
// Hover is a tens-of-times interaction, so the morph stays short; on-screen
// shape change uses the strong ease-in-out curve.
const HOVER_MORPH_TRANSITION = { duration: 0.25, ease: [0.77, 0, 0.175, 1] };
const HOVER_SCALE = 1.05;
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

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), SPRING);
  const scale = useSpring(1, SPRING);
  // One full transform string instead of Motion's rotateX/rotateY/scale
  // shorthands, which skip hardware acceleration.
  const transform = useMotionTemplate`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

  function handleMouseMove(event) {
    if (prefersReducedMotion || !ref.current || !canHover()) return;
    const bounds = ref.current.getBoundingClientRect();
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleEnter() {
    if (prefersReducedMotion || !canHover()) return;
    scale.set(HOVER_SCALE);
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
          transform: prefersReducedMotion ? "none" : transform,
          transformStyle: "preserve-3d",
        }}
        className="relative h-12 w-12 overflow-hidden bg-[var(--color-avatar-bg)] shadow-[0px_6px_7px_0px_rgba(0,0,0,0.3),0px_0px_0px_1px_rgba(0,0,0,0.06)] will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute left-1/2 top-[-1px] h-[65px] w-[52px] max-w-none -translate-x-1/2 object-cover"
        />
      </motion.div>
    </div>
  );
}
