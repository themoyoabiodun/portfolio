"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

// Smooth in-out: the camera and cursor are both moving across the screen,
// so they accelerate and settle rather than snapping off the mark.
const EASE = [0.65, 0, 0.35, 1];
const CLICK_MS = 140;

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

// Camera offset that centres `focus` at `zoom`, clamped so the screen never
// pulls away from the frame's edges. Values are fractions of the frame.
function frame([fx, fy], zoom, [w, h]) {
  const clamp = (v) => Math.min(0, Math.max(1 - zoom, v));
  return { x: clamp(0.5 - zoom * (fx / w)), y: clamp(0.5 - zoom * (fy / h)) };
}

function CursorIcon() {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="none"
      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
    >
      <path
        d="M1.5 1.5v16.2l4.1-3.9 2.6 6 2.9-1.3-2.6-5.8h5.7L1.5 1.5Z"
        fill="#171717"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Auto-playing walkthrough of a product flow: a cursor clicks through the
// screens while the camera follows the action. It plays only while active
// and on screen, restarting from the top each time it comes back.
export default function FlowDemo({ demo, active }) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [screen, setScreen] = useState(0);
  const [fade, setFade] = useState(300);
  const [typed, setTyped] = useState("");
  const [clicks, setClicks] = useState(0);

  const [w, h] = demo.size;
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const zoom = useMotionValue(1);
  const curX = useMotionValue(demo.cursor[0] / w);
  const curY = useMotionValue(demo.cursor[1] / h);
  const press = useMotionValue(1);

  const cameraTransform = useTransform(
    [camX, camY, zoom],
    ([x, y, s]) => `translate(${x * 100}%, ${y * 100}%) scale(${s})`,
  );
  // The cursor sits outside the camera so it stays the same size, but is
  // placed through the camera's transform so it stays on its target.
  const cursorTransform = useTransform(
    [camX, camY, zoom, curX, curY],
    ([x, y, s, cx, cy]) =>
      `translate(${(x + s * cx) * 100}%, ${(y + s * cy) * 100}%)`,
  );

  // Decode every screen up front so crossfades never land on a blank frame.
  useEffect(() => {
    if (!active || ready) return;
    let cancelled = false;
    Promise.all(
      demo.screens.map(({ src }) => {
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => {});
      }),
    ).then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [active, ready, demo]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const playing = active && ready && visible && !reduceMotion;

  useEffect(() => {
    if (!playing) return;
    const controller = new AbortController();
    const { signal } = controller;
    const running = new Set();

    const tween = (value, to, duration) => {
      const animation = animate(value, to, {
        duration: duration / 1000,
        ease: EASE,
      });
      running.add(animation);
      return animation.finished.then(() => {
        running.delete(animation);
        if (signal.aborted) throw signal.reason;
      });
    };

    const reset = () => {
      setScreen(0);
      setTyped("");
      camX.jump(0);
      camY.jump(0);
      zoom.jump(1);
      curX.jump(demo.cursor[0] / w);
      curY.jump(demo.cursor[1] / h);
      press.jump(1);
    };

    const actions = {
      wait: ({ wait }) => sleep(wait, signal),
      camera: ({ camera, zoom: s, duration }) => {
        const { x, y } = frame(camera, s, demo.size);
        return Promise.all([
          tween(camX, x, duration),
          tween(camY, y, duration),
          tween(zoom, s, duration),
        ]);
      },
      move: ({ move: [x, y], duration }) =>
        Promise.all([
          tween(curX, x / w, duration),
          tween(curY, y / h, duration),
        ]),
      click: async () => {
        await tween(press, 0.82, CLICK_MS / 2);
        setClicks((n) => n + 1);
        await tween(press, 1, CLICK_MS);
      },
      screen: async ({ screen: index, fade: ms = 300 }) => {
        setFade(ms);
        setScreen(index);
        if (index === 0) setTyped("");
        await sleep(ms, signal);
      },
      type: async ({ type, interval }) => {
        for (let i = 1; i <= type.length; i++) {
          setTyped(type.slice(0, i));
          await sleep(interval, signal);
        }
      },
    };

    const run = async () => {
      reset();
      for (;;) {
        for (const action of demo.script) {
          const kind = Object.keys(actions).find((key) => key in action);
          const done = actions[kind](action);
          if (action.parallel) done.catch(() => {});
          else await done;
        }
      }
    };

    run().catch(() => {});
    return () => {
      controller.abort();
      running.forEach((animation) => animation.stop());
    };
  }, [playing, demo, w, h, camX, camY, zoom, curX, curY, press]);

  if (reduceMotion) return null;

  const showCode = demo.code?.screens.includes(screen);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-shown={active && ready ? "" : undefined}
      className="flow-demo pointer-events-none absolute inset-0"
    >
      {/* The dashboard's box inside the 666×482 cover image. */}
      <div className="absolute top-[4.033%] left-[3.303%] h-[91.766%] w-[93.393%] overflow-hidden rounded-[2px] bg-white [container-type:inline-size]">
        <motion.div
          style={{ transform: cameraTransform }}
          className="absolute inset-0 origin-top-left will-change-transform"
        >
          {demo.screens.map(({ src }, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- static export
            <img
              key={src}
              src={ready ? src : undefined}
              alt=""
              draggable={false}
              data-current={i === screen ? "" : undefined}
              style={{ transitionDuration: `${fade}ms` }}
              className="flow-demo-screen absolute inset-0 h-full w-full"
            />
          ))}
          {showCode &&
            demo.code.boxes.map(([x, y], i) =>
              // Only typed boxes are covered, so the placeholders show
              // through until a digit lands.
              typed[i] ? (
                <span
                  key={`${x}-${y}`}
                  style={{
                    left: `${(x / w) * 100}%`,
                    top: `${(y / h) * 100}%`,
                  }}
                  className="absolute flex h-[1.95cqw] w-[1.67cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white text-[1.11cqw] font-medium text-[#171717]"
                >
                  <span className="flow-demo-digit">{typed[i]}</span>
                </span>
              ) : null,
            )}
        </motion.div>
        <motion.div
          style={{ transform: cursorTransform }}
          className="absolute inset-0 will-change-transform"
        >
          {clicks > 0 && (
            <span key={clicks} className="flow-demo-ripple absolute" />
          )}
          <motion.span
            style={{ scale: press }}
            className="absolute block origin-top-left"
          >
            <CursorIcon />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}
