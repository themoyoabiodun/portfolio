"use client";

import { useEffect, useRef, useState } from "react";

const COPIED_MS = 1500;

// Email address with a copy button (Figma 2233:2023). The address stays
// selectable text; the icon swaps to a check while "Copied" is announced.
export default function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const icon = (name, extra = "") => (
    <span
      aria-hidden="true"
      className={`code-copy-icon inline-block size-4 bg-current ${extra}`}
      style={{
        mask: `url(/asset/icons/${name}.svg) center / contain no-repeat`,
        WebkitMask: `url(/asset/icons/${name}.svg) center / contain no-repeat`,
      }}
    />
  );

  return (
    <span className="flex items-center gap-2">
      <a href={`mailto:${email}`} className="footer-link">
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy email address"}
        data-copied={copied ? "" : undefined}
        className="code-copy relative -m-1 flex size-6 items-center justify-center rounded-[6px] text-[var(--color-text-muted)]"
      >
        {icon("copy")}
        {icon("check", "code-copy-check absolute")}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </span>
  );
}
