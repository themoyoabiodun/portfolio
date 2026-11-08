"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
  useSpring,
} from "motion/react";
import Book3D from "./Book3D";
import { FIRST_HERO_ID, INITIAL_SHELF, makeBook } from "./books";
import { CONTROL_GROUPS, DEFAULT_CONFIG, PRESETS, TOGGLES } from "./config";
import { tapHaptic } from "@/lib/haptics";

// Stage geometry, in stage pixels. The stage is scaled down to fit narrow
// screens, so everything inside can use fixed numbers.
const STAGE_W = 800;
const STAGE_H = 560;
const HERO_X = 400;
const HERO_Y = 172;
const SHELF_Y = 468; // top of the plank's front edge
const PLANK_W = 520;
const PLANK_LEFT = (STAGE_W - PLANK_W) / 2;
const PLANK_DEPTH = 120;
const PLANK_THICK = 20;
const SHELF_INSET = 24;
const SHELF_INNER = PLANK_W - SHELF_INSET * 2;
const S = 0.62; // books on the shelf, relative to the hero book
const GAP = 3;

const STORAGE_KEY = "shelf-lab-config";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const spring = (visualDuration, bounce) => ({ type: "spring", visualDuration, bounce });
const spineW = (b) => b.d * S;
const bookZ = (b) => -(b.w * S) / 2 - 6;

const shelfWidth = (books) =>
  books.reduce((sum, b) => sum + spineW(b) + GAP, 0) - GAP;

// Centre of every book on the shelf, packed as a row centred on the plank,
// so a new book makes its neighbours on both sides shuffle over.
function layout(books) {
  let x = PLANK_LEFT + (PLANK_W - shelfWidth(books)) / 2;
  return books.map((b) => {
    const cx = x + spineW(b) / 2;
    x += spineW(b) + GAP;
    return { cx, cy: SHELF_Y - (b.h * S) / 2, z: bookZ(b) };
  });
}

function insertIndex(mode, length) {
  if (mode === "end") return length;
  if (mode === "start") return 0;
  if (mode === "random") return Math.floor(Math.random() * (length + 1));
  return Math.floor(length / 2);
}

export default function ShelfLab() {
  const systemReduced = useReducedMotion();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [speed, setSpeed] = useState(1);
  const [forceReduced, setForceReduced] = useState(false);
  const reduced = systemReduced || forceReduced;

  const [shelf, setShelf] = useState(INITIAL_SHELF);
  const [hero, setHero] = useState(() => makeBook(FIRST_HERO_ID));
  const [nextId, setNextId] = useState(FIRST_HERO_ID + 1);
  const [pending, setPending] = useState(null); // { book, index } while in flight
  const [inFlight, setInFlight] = useState(false);
  const [history, setHistory] = useState([]); // ids added, newest last
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  const [scope, animate] = useAnimate();
  const busy = useRef(false);
  const moverRef = useRef(null);
  const arcRef = useRef(null);
  const orientRef = useRef(null);
  const shadowRef = useRef(null);
  const shelfGroupRef = useRef(null);
  const timers = useRef([]);

  // Pointer tilt on the waiting book.
  const tiltX = useSpring(0, { stiffness: 220, damping: 22 });
  const tiltY = useSpring(0, { stiffness: 220, damping: 22 });

  // Scale the fixed-size stage to the available width.
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / STAGE_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Remember tuning between visits.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      // Read after hydration so the server and first client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setConfig({ ...DEFAULT_CONFIG, ...saved });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const [preset, setPreset] = useState(null);
  const set = (key, value) => {
    setPreset(null);
    setConfig((c) => ({ ...c, [key]: value }));
  };

  const layoutWith = pending
    ? [...shelf.slice(0, pending.index), pending.book, ...shelf.slice(pending.index)]
    : shelf;
  const positions = layout(layoutWith);
  const full = !hero || shelfWidth([...shelf, hero]) > SHELF_INNER;

  const add = useCallback(async () => {
    if (busy.current || !hero) return;
    if (shelfWidth([...shelf, hero]) > SHELF_INNER) return;
    busy.current = true;
    setInFlight(true);
    if (config.haptics) tapHaptic();

    const c = config;
    const t = 1 / speed; // slow motion stretches every timing
    const book = hero;
    const index = insertIndex(c.insert, shelf.length);
    const finalShelf = [...shelf.slice(0, index), book, ...shelf.slice(index)];
    const target = layout(finalShelf)[index];
    const tx = target.cx - HERO_X;
    const ty = target.cy - HERO_Y;

    const mover = moverRef.current;
    const arc = arcRef.current;
    const orient = orientRef.current;
    const shadow = shadowRef.current;
    tiltX.set(0);
    tiltY.set(0);

    if (reduced) {
      // No travel: the book fades from the stand and appears in its slot.
      await animate(mover, { opacity: 0 }, { duration: 0.15 });
      animate(shadow, { opacity: 0 }, { duration: 0.15 });
    } else {
      // 1. Anticipation: a small squeeze before the lift.
      if (c.anticipation > 0) {
        animate(
          orient,
          { scale: 1 - c.anticipation, rotateX: -3 },
          { duration: c.anticipationDuration * t, ease: [0.3, 0, 0.6, 1] },
        );
        await sleep(c.anticipationDuration * t * 1000);
      }

      // 2. Lift off the stand.
      const lift = spring(c.liftDuration * t, c.liftBounce);
      animate(mover, { y: -c.lift }, lift);
      animate(orient, { scale: 1.03, rotateX: c.liftTilt }, lift);
      animate(shadow, { scale: 0.75, opacity: 0.35 }, lift);
      await sleep(c.liftDuration * t * 800);

      // 3. Flight: travel to just above the slot, turning spine-out.
      const fd = c.flightDuration * t;
      const fly = spring(fd, c.flightBounce);
      animate(mover, { x: tx, y: ty - c.dropHeight, z: target.z }, fly);
      animate(arc, { y: [0, -c.arc, 0] }, { duration: fd, times: [0, 0.45, 1], ease: [0.33, 0, 0.67, 1] });
      animate(
        orient,
        { rotateY: 90 + 360 * c.spins, rotateX: 0, scale: S },
        spring(fd, c.flightBounce * 0.6),
      );
      animate(orient, { rotate: [0, c.flightTilt, 0] }, { duration: fd, ease: "easeInOut" });
      animate(shadow, { opacity: 0, scale: 0.4 }, { duration: fd * 0.5 });
      later(() => setPending({ book, index }), c.makeRoomAt * fd * 1000);
      await sleep(fd * 1000);

      // 4. Drop into the slot, accelerating like it has weight.
      setPending({ book, index });
      await animate(
        mover,
        { y: ty },
        { duration: Math.max(c.dropDuration * t, 0.01), ease: [0.55, 0, 1, 0.45] },
      );
    }

    // 5. Hand the book to the shelf and play the impact.
    flushSync(() => {
      setShelf(finalShelf);
      setPending(null);
      setHero(null);
      setHistory((h) => [...h, book.id]);
    });
    if (c.haptics) tapHaptic();

    const slot = scope.current.querySelector(`[data-book="${book.id}"]`);
    if (reduced) {
      animate(slot, { opacity: [0, 1] }, { duration: 0.2 });
    } else {
      const squashEl = slot.querySelector("[data-squash]");
      if (c.squash > 0) {
        animate(squashEl, { scaleY: 1 - c.squash, scaleX: 1 + c.squash * 0.6 }, { duration: 0.06 * t, ease: "easeOut" }).then(
          () => animate(squashEl, { scaleY: 1, scaleX: 1 }, spring(0.35 * t, c.settleBounce)),
        );
      }

      // Neighbours lean away, rippling outward.
      if (c.nudge > 0) {
        [-1, 1].forEach((dir) => {
          [1, 2, 3].forEach((step) => {
            const neighbour = finalShelf[index + dir * step];
            if (!neighbour) return;
            const lean = scope.current.querySelector(`[data-book="${neighbour.id}"] [data-lean]`);
            if (!lean) return;
            lean.style.transformOrigin = dir < 0 ? "0% 100%" : "100% 100%";
            const amount = (c.nudge * dir) / step ** 1.4;
            const delay = (step - 1) * 0.04 * t;
            animate(lean, { rotate: amount }, { duration: 0.08 * t, delay, ease: "easeOut" }).then(() =>
              animate(lean, { rotate: 0 }, spring(0.45 * t, c.settleBounce)),
            );
          });
        });
      }

      if (c.shelfBounce > 0) {
        const group = shelfGroupRef.current;
        animate(group, { y: c.shelfBounce }, { duration: 0.06 * t, ease: "easeOut" }).then(() =>
          animate(group, { y: 0 }, spring(0.4 * t, 0.5)),
        );
      }
    }

    const key = Date.now();
    if (c.badge || c.glow) setConfirm({ key, x: target.cx, y: SHELF_Y - book.h * S, z: target.z });
    if (c.toast) setToast({ key, title: book.title, count: finalShelf.length });
    later(() => setConfirm((v) => (v?.key === key ? null : v)), 1100 * t);
    later(() => setToast((v) => (v?.key === key ? null : v)), 2200);

    // 6. Bring out the next book.
    await sleep(reduced ? 150 : 260 * t);
    setHero(makeBook(nextId));
    setNextId((n) => n + 1);
    busy.current = false;
    setInFlight(false);
  }, [animate, config, hero, nextId, reduced, scope, shelf, speed, tiltX, tiltY]);

  const undo = useCallback(() => {
    if (busy.current || history.length === 0) return;
    const id = history[history.length - 1];
    const book = shelf.find((b) => b.id === id);
    setShelf((s) => s.filter((b) => b.id !== id));
    setHistory((h) => h.slice(0, -1));
    // The removed book goes back on the stand; the waiting one returns to the pile.
    if (hero) setNextId(hero.id);
    setHero(book);
  }, [hero, history, shelf]);

  // Replay = undo, then add once the stand has re-rendered with that book.
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  }, [add]);
  const replay = () => {
    if (busy.current || history.length === 0) return;
    undo();
    later(() => addRef.current(), 350);
  };

  const reset = () => {
    if (busy.current) return;
    setShelf(INITIAL_SHELF);
    setHistory([]);
    setHero(makeBook(FIRST_HERO_ID));
    setNextId(FIRST_HERO_ID + 1);
  };

  const onPointerMove = (e) => {
    if (busy.current || reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.35;
    tiltY.set(px * 30);
    tiltX.set(-py * 22);
  };
  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      later(() => setCopied(false), 1500);
    } catch {}
  };

  const preserve = { transformStyle: "preserve-3d" };

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f5f1] text-[var(--color-text-primary)] lg:flex-row">
      {/* Stage */}
      <section className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-sm font-medium leading-[22px]">Shelf motion lab</h1>
            <p className="text-[13px] leading-[19px] text-[var(--color-text-muted)]">
              Tune how a book lands when it is added to the shelf.
            </p>
          </div>
          <div className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
            On shelf{" "}
            <motion.span
              key={shelf.length}
              initial={reduced ? false : { y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={spring(0.3, 0.3)}
              className="inline-block font-medium text-[var(--color-text-primary)]"
            >
              {shelf.length}
            </motion.span>
          </div>
        </header>

        <div ref={frameRef} className="w-full" style={{ height: STAGE_H * scale }}>
          <div
            ref={scope}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="relative overflow-hidden rounded-2xl"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
              perspective: config.perspective,
              perspectiveOrigin: "50% 42%",
              background: "radial-gradient(120% 90% at 50% 20%, #fbfaf7 0%, #efebe4 60%, #e6e0d6 100%)",
            }}
          >
            <div className="absolute inset-0" style={{ ...preserve, transform: `rotateX(${config.cameraTilt}deg)` }}>
              {/* Shelf: back wall, plank, books */}
              <motion.div ref={shelfGroupRef} className="absolute inset-0" style={preserve}>
                <div
                  className="absolute"
                  style={{
                    left: PLANK_LEFT,
                    top: SHELF_Y - 230,
                    width: PLANK_W,
                    height: 230,
                    transform: `translateZ(${-PLANK_DEPTH}px)`,
                    background: "linear-gradient(180deg, #e9e3d8, #ddd5c7)",
                    borderRadius: "6px 6px 0 0",
                  }}
                />
                {/* Plank top */}
                <div
                  className="absolute"
                  style={{
                    left: PLANK_LEFT,
                    top: SHELF_Y,
                    width: PLANK_W,
                    height: PLANK_DEPTH,
                    transformOrigin: "50% 0",
                    transform: "rotateX(-90deg)",
                    background: "linear-gradient(0deg, #a87a50 0%, #c99a6c 40%, #d6aa7c 100%)",
                  }}
                >
                  <AnimatePresence>
                    {confirm && config.glow && (
                      <motion.div
                        key={confirm.key}
                        className="absolute rounded-full"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                          left: confirm.x - PLANK_LEFT - 60,
                          top: -confirm.z - 40,
                          width: 120,
                          height: 80,
                          background: "radial-gradient(closest-side, rgba(255,246,214,0.95), rgba(255,236,180,0))",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                {/* Plank front */}
                <div
                  className="absolute"
                  style={{
                    left: PLANK_LEFT,
                    top: SHELF_Y,
                    width: PLANK_W,
                    height: PLANK_THICK,
                    background: "linear-gradient(180deg, #c08f60, #9c6c42)",
                    borderRadius: "0 0 3px 3px",
                    boxShadow: "0 18px 30px -12px rgba(60,40,20,0.35)",
                  }}
                />

                {layoutWith.map((b, i) => {
                  if (pending && b.id === pending.book.id) return null;
                  const p = positions[i];
                  return (
                    <motion.div
                      key={b.id}
                      data-book={b.id}
                      className="absolute"
                      initial={false}
                      animate={{ x: p.cx - spineW(b) / 2 }}
                      transition={spring(0.45 / speed, 0.2)}
                      style={{
                        ...preserve,
                        left: 0,
                        top: p.cy - (b.h * S) / 2,
                        width: spineW(b),
                        height: b.h * S,
                        z: p.z,
                      }}
                    >
                      <div data-lean className="absolute inset-0" style={preserve}>
                        <div data-squash className="absolute inset-0" style={{ ...preserve, transformOrigin: "50% 100%" }}>
                          <div className="absolute inset-0" style={{ ...preserve, transform: `rotateY(90deg) scale(${S})` }}>
                            <Book3D book={b} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Waiting book */}
              {hero && (
                <>
                  <motion.div
                    key={`shadow-${hero.id}`}
                    ref={shadowRef}
                    className="absolute rounded-[50%]"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 0.55, scale: 1 }}
                    transition={spring(0.4, 0.2)}
                    style={{
                      left: HERO_X - hero.w * 0.55,
                      top: HERO_Y + hero.h / 2 + 26,
                      width: hero.w * 1.1,
                      height: 22,
                      background: "radial-gradient(closest-side, rgba(40,28,16,0.4), rgba(40,28,16,0))",
                    }}
                  />
                  <motion.div
                    key={hero.id}
                    ref={moverRef}
                    className="absolute"
                    style={{
                      ...preserve,
                      left: HERO_X - hero.w / 2,
                      top: HERO_Y - hero.h / 2,
                      width: hero.w,
                      height: hero.h,
                    }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.92, rotateY: -35 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                      transition={reduced ? { duration: 0.2 } : spring(0.5, 0.3)}
                      style={preserve}
                    >
                      <motion.div className="absolute inset-0" style={{ ...preserve, rotateX: tiltX, rotateY: tiltY }}>
                        <div ref={arcRef} className="absolute inset-0" style={preserve}>
                          <div ref={orientRef} className="absolute inset-0" style={preserve}>
                            <Book3D book={hero} />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </>
              )}

              {/* Check badge above the slot */}
              <AnimatePresence>
                {confirm && config.badge && (
                  <motion.div
                    key={confirm.key}
                    className="absolute flex size-7 items-center justify-center rounded-full bg-[#171717] text-white shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -8 }}
                    transition={reduced ? { duration: 0.15 } : spring(0.35, 0.45)}
                    style={{ left: confirm.x - 14, top: confirm.y - 42, z: confirm.z }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <motion.path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={reduced ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.25, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Toast */}
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
              <AnimatePresence>
                {toast && (
                  <motion.div
                    key={toast.key}
                    role="status"
                    className="flex items-center gap-2 rounded-full bg-[#171717] py-2 pr-4 pl-2.5 text-[13px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } }}
                    transition={reduced ? { duration: 0.15 } : spring(0.35, 0.25)}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-white/15">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>
                      Added <span className="opacity-70">“{toast.title}”</span> to your shelf
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={add}
            disabled={inFlight || full}
            className="lab-button rounded-full bg-[#171717] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {full ? "Shelf is full" : "Add to shelf"}
          </button>
          <button type="button" onClick={replay} disabled={inFlight || history.length === 0} className="lab-button lab-secondary">
            Replay last
          </button>
          <button type="button" onClick={undo} disabled={inFlight || history.length === 0} className="lab-button lab-secondary">
            Undo
          </button>
          <button type="button" onClick={reset} disabled={inFlight} className="lab-button lab-secondary">
            Reset shelf
          </button>
        </div>
      </section>

      {/* Controls */}
      <aside className="w-full shrink-0 border-t border-black/5 bg-white p-4 md:p-6 lg:h-svh lg:w-[340px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex flex-col gap-6">
          <Field label="Preset">
            <Segmented
              options={Object.keys(PRESETS)}
              value={preset}
              wrap
              onChange={(name) => {
                setPreset(name);
                setConfig({ ...DEFAULT_CONFIG, ...PRESETS[name], insert: config.insert });
              }}
            />
          </Field>

          <div className="flex flex-col gap-4">
            <Field label="Playback speed">
              <Segmented
                options={[0.25, 0.5, 1]}
                format={(v) => `${v}×`}
                value={speed}
                onChange={setSpeed}
              />
            </Field>
            <Field label="Insert at">
              <Segmented
                options={["start", "middle", "end", "random"]}
                format={(v) => v[0].toUpperCase() + v.slice(1)}
                value={config.insert}
                onChange={(v) => set("insert", v)}
              />
            </Field>
          </div>

          {CONTROL_GROUPS.map((group) => (
            <fieldset key={group.title} className="flex flex-col gap-3">
              <legend className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[var(--color-text-muted)] uppercase">
                {group.title}
              </legend>
              {group.items.map((item) => (
                <Slider key={item.key} item={item} value={config[item.key]} onChange={(v) => set(item.key, v)} />
              ))}
            </fieldset>
          ))}

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[var(--color-text-muted)] uppercase">
              Confirmation
            </legend>
            {TOGGLES.map((tg) => (
              <Toggle key={tg.key} label={tg.label} checked={config[tg.key]} onChange={(v) => set(tg.key, v)} />
            ))}
            <Toggle
              label={systemReduced ? "Reduced motion (on in system)" : "Preview reduced motion"}
              checked={reduced}
              disabled={systemReduced}
              onChange={setForceReduced}
            />
          </fieldset>

          <div className="flex gap-2 pb-2">
            <button type="button" onClick={copyConfig} className="lab-button lab-secondary flex-1">
              {copied ? "Copied" : "Copy config"}
            </button>
            <button type="button" onClick={() => {
                setPreset(null);
                setConfig(DEFAULT_CONFIG);
              }} className="lab-button lab-secondary flex-1">
              Defaults
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--color-text-muted)] uppercase">{label}</span>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange, wrap = false, format = (v) => v }) {
  return (
    <div className={`${wrap ? "grid grid-cols-3" : "flex"} gap-1 rounded-[10px] bg-[#f2f1ef] p-1`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className="lab-seg flex-1 rounded-[7px] px-1.5 py-1 text-[12px] font-medium whitespace-nowrap text-[var(--color-text-secondary)] aria-pressed:bg-white aria-pressed:text-[var(--color-text-primary)] aria-pressed:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

function Slider({ item, value, onChange }) {
  const display = item.format
    ? item.format(value)
    : `${value.toFixed(item.step >= 1 ? 0 : item.step >= 0.1 ? 1 : 2)}${item.unit ?? ""}`;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-[13px]">
        <span>{item.label}</span>
        <span className="tabular-nums text-[var(--color-text-muted)]">{display}</span>
      </span>
      <input
        type="range"
        min={item.min}
        max={item.max}
        step={item.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-range"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className={disabled ? "text-[var(--color-text-muted)]" : ""}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="lab-switch"
      />
    </label>
  );
}
