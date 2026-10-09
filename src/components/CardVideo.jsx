"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Every card video on the page joins one group. Playback starts for all of
// them together once each can play (or after a short timeout, so one slow
// clip can't hold the rest back), then each loops on its own.
//
// Decoding six high-resolution clips is the heaviest thing the page does,
// so a clip only plays while it is on screen, and the cards pause while a
// case study covers them. That keeps scrolling and the drawer smooth.
const group = new Set();
const visible = new WeakSet();
const START_TIMEOUT_MS = 2500;
let started = false;
let held = false; // a case study is open over the cards
let timer = null;

const shouldPlay = (video) => started && !held && visible.has(video);

function sync(video) {
  if (shouldPlay(video)) video.play().catch(() => {});
  else video.pause();
}

function startAll(force = false) {
  if (started) return;
  const videos = [...group];
  if (!force && !videos.every((v) => v.readyState >= 3)) return;
  started = true;
  clearTimeout(timer);
  for (const v of videos) {
    v.currentTime = 0;
    sync(v);
  }
}

// Called by the case study drawer while it is open.
export function holdCardVideos(hold) {
  held = hold;
  group.forEach(sync);
}

// `standalone` videos (the one inside the drawer) skip the group: they play
// whenever they're on screen.
export default function CardVideo({ src, poster, label, standalone = false }) {
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) visible.add(video);
        else visible.delete(video);
        if (standalone) {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        } else {
          sync(video);
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(video);

    if (standalone) return () => observer.disconnect();

    group.add(video);
    // A video that joins after the group started (e.g. reduced motion
    // switched off) just follows the group's state.
    if (started) sync(video);
    const onReady = () => startAll();
    video.addEventListener("canplay", onReady);
    onReady();
    timer ??= setTimeout(() => startAll(true), START_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", onReady);
      group.delete(video);
    };
  }, [prefersReducedMotion, standalone]);

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
      className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
    />
  );
}
