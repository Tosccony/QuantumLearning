"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Icon from "./Icon";

/**
 * Modal dialog with a real focus trap: focus moves in on open, Tab cycles inside,
 * Escape and the backdrop close it, and focus returns to the opener on close.
 */
export default function Dialog({
  title,
  children,
  onClose,
  size = "md",
  paper = true,
  sheet = false,
  describedBy,
}: {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  /** White window (default) or navy frame. */
  paper?: boolean;
  /** Slide up from the bottom on small screens. */
  sheet?: boolean;
  describedBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={describedBy}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 open:flex ${sheet ? "items-end sm:items-center" : "items-center"} justify-center bg-[rgba(11,26,51,0.72)] p-3 text-paper sm:p-6`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full ${width} max-h-[min(92dvh,900px)] overflow-y-auto outline-none ${paper ? "window" : "frame"} ${sheet ? "sm:mb-0" : ""}`}
      >
        <div className="perf" aria-hidden />
        <header className="flex items-center gap-3 px-5 pt-4">
          <h2 id={`${id}-title`} className="display mr-auto text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className={`flex h-11 w-11 items-center justify-center ${paper ? "keycap-paper" : "keycap"} !px-0`} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </div>
    </dialog>
  );
}
