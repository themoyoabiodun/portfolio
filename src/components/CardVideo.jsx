"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Looping, muted preview clip that starts as soon as the page loads.
// `autoPlay` lets the browser start it before hydration; the effect makes
// sure it's playing (or, with reduced motion, paused on its poster/first
// frame) once React takes over.
export default function CardVideo({ src, poster, label }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (prefersReducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
