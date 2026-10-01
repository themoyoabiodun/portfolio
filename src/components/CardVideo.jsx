"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Every card video on the page joins one group. Playback starts for all of
// them together once each can play (or after a short timeout, so one slow
// clip can't hold the rest back), then each loops on its own.
const group = new Set();
const START_TIMEOUT_MS = 2500;
let started = false;
let timer = null;

function startAll(force = false) {
  if (started) return;
  const videos = [...group];
  if (!force && !videos.every((v) => v.readyState >= 3)) return;
  started = true;
  clearTimeout(timer);
  for (const v of videos) {
    v.currentTime = 0;
    v.play().catch(() => {});
  }
}

export default function CardVideo({ src, poster, label }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Reduced motion: stay paused on the poster/first frame.
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    group.add(video);
    // A video that joins after the group started (e.g. reduced motion
    // switched off) just plays.
    if (started) video.play().catch(() => {});
    const onReady = () => startAll();
    video.addEventListener("canplay", onReady);
    onReady();
    timer ??= setTimeout(() => startAll(true), START_TIMEOUT_MS);

    return () => {
      video.removeEventListener("canplay", onReady);
      group.delete(video);
    };
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
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
