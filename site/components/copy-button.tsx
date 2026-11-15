"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "error";

export function CopyButton({ text, what = "code" }: { text: string; what?: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={copy}
      data-state={state}
      aria-label={`Copy ${what}`}
    >
      {state === "copied" ? (
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="8.5" height="8.5" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H3.8A1.5 1.5 0 0 0 2.3 3v5.2A1.5 1.5 0 0 0 3.8 9.7H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span aria-hidden="true" className="copy-text">
        {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy"}
      </span>
      <span className="sr-only" role="status">
        {state === "copied" ? "Copied to clipboard" : state === "error" ? "Could not copy. Select the text and copy it manually." : ""}
      </span>
    </button>
  );
}
