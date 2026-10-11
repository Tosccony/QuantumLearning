"use client";

import { useEffect, useRef } from "react";

type Key = { key: string; ctrlKey: boolean; altKey: boolean; metaKey: boolean; repeat: boolean; defaultPrevented: boolean };

/** What a key press means in a lesson: a 0-based section index, "tutor", or null to ignore it. `blocked` is the DOM check (field, circuit editor, open dialog). */
export function lessonKey(e: Key, blocked: boolean, sections: number): number | "tutor" | null {
  if (blocked || e.ctrlKey || e.altKey || e.metaKey || e.repeat || e.defaultPrevented) return null;
  if (e.key === "t" || e.key === "T") return "tutor";
  const n = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
  return n >= 1 && n <= sections ? n - 1 : null;
}

const TYPING = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="application"]';

/** Number keys call onSection(index), T calls onTutor(). Storage-free: the caller owns `enabled`. */
export function useLessonKeys({ enabled, sections, onSection, onTutor }: { enabled: boolean; sections: number; onSection: (i: number) => void; onTutor: () => void }) {
  const cb = useRef({ onSection, onTutor });
  useEffect(() => {
    cb.current = { onSection, onTutor };
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const blocked = !!document.querySelector("dialog[open]") || (e.target instanceof Element && !!e.target.closest(TYPING));
      const k = lessonKey(e, blocked, sections);
      if (k === null) return;
      e.preventDefault();
      if (k === "tutor") cb.current.onTutor();
      else cb.current.onSection(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, sections]);
}

/** Focus a heading by id; the heading carries tabIndex -1 and scroll-mt-24. */
export const focusById = (id: string) => document.getElementById(id)?.focus();

/** A small non-interactive keycap; the heading's aria-keyshortcuts carries the meaning. */
export function Kbd({ children }: { children: string }) {
  return <kbd className="kbd" aria-hidden="true">{children}</kbd>;
}

export function KeysHint({ enabled, sections, tutor, onToggle }: { enabled: boolean; sections: number; tutor: string; onToggle: () => void }) {
  return (
    <p className="keys-hint flex flex-wrap items-center gap-x-3 text-xs text-fog">
      <span>{enabled ? `Keys: ${sections > 1 ? `1–${sections}` : "1"} sections · T ${tutor}` : "Keyboard shortcuts off"}</span>
      <button type="button" onClick={onToggle} className="min-h-11 underline underline-offset-2 hover:text-paper">{enabled ? "Turn off" : "Turn on"}</button>
    </p>
  );
}
