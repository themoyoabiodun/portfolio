"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Hover intent: a short delay stops the toolbar flashing open as the pointer
// passes over the text; the close delay lets the pointer travel onto it.
const OPEN_DELAY_MS = 100;
const CLOSE_DELAY_MS = 120;
// Once one preview has been seen, a neighbour opened soon after skips both
// the delay and the animation (tooltip recipe in the animate skill).
const INSTANT_WINDOW_MS = 400;
const VIEWPORT_GUTTER_PX = 8;

let lastClosedAt = 0;

function isFinePointer(event) {
  return event.pointerType === "mouse" || event.pointerType === "pen";
}

// An underlined company name that reveals a branded link toolbar above it.
export default function LinkPreview({ children, href, url, icon, color }) {
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const [shift, setShift] = useState(0);
  const timer = useRef(null);
  const rootRef = useRef(null);
  const toolbarRef = useRef(null);

  const show = useCallback((immediate = false) => {
    clearTimeout(timer.current);
    const skip = immediate || Date.now() - lastClosedAt < INSTANT_WINDOW_MS;
    if (skip) {
      setInstant(Date.now() - lastClosedAt < INSTANT_WINDOW_MS);
      setOpen(true);
    } else {
      timer.current = setTimeout(() => {
        setInstant(false);
        setOpen(true);
      }, OPEN_DELAY_MS);
    }
  }, []);

  const hide = useCallback((immediate = false) => {
    clearTimeout(timer.current);
    const close = () => {
      setOpen((wasOpen) => {
        if (wasOpen) lastClosedAt = Date.now();
        return false;
      });
    };
    if (immediate) close();
    else timer.current = setTimeout(close, CLOSE_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Keep the toolbar inside the viewport on narrow screens.
  useLayoutEffect(() => {
    if (!open || !toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    const overflow =
      rect.right - shift - (window.innerWidth - VIEWPORT_GUTTER_PX);
    setShift(overflow > 0 ? -overflow : 0);
    // Measuring only when it opens; shift is applied via a CSS variable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Touch: tapping anywhere else, or pressing Escape, closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) hide(true);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") hide(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, hide]);

  const lastPointerType = useRef("mouse");

  return (
    <span
      ref={rootRef}
      className="link-preview relative inline-block"
      onPointerEnter={(e) => isFinePointer(e) && show()}
      onPointerLeave={(e) => isFinePointer(e) && hide()}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="link-preview-trigger dotted-underline whitespace-nowrap"
        onPointerDown={(e) => {
          lastPointerType.current = e.pointerType;
        }}
        onClick={(e) => {
          // Touch has no hover: the first tap reveals the toolbar, a tap on
          // the toolbar (or a second tap here) follows the link.
          if (lastPointerType.current === "touch" && !open) {
            e.preventDefault();
            show(true);
          }
        }}
        onFocus={() => show(true)}
        onBlur={() => hide(true)}
      >
        {children}
      </a>

      <a
        ref={toolbarRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        data-open={open ? "" : undefined}
        data-instant={instant ? "" : undefined}
        className="link-preview-toolbar absolute bottom-[calc(100%-2px)] left-[-4px] z-20 flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-[8px] px-1 py-0.5 text-sm font-medium leading-[22px] text-white shadow-[0px_9px_15px_0px_rgba(0,0,0,0.15),0px_3px_3px_0px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: color, "--preview-shift": `${shift}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG icon */}
        <img src={icon} alt="" width={20} height={20} className="size-5 shrink-0" />
        {url}
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG icon */}
        <img
          src="/asset/icons/chevron-right.svg"
          alt=""
          width={16}
          height={16}
          className="link-preview-chevron size-4 shrink-0"
        />
      </a>
    </span>
  );
}
