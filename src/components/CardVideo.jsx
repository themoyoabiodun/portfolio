"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Looping, muted preview clip. With reduced motion the clip stays paused on
// its poster/first frame instead of autoplaying.
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
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
