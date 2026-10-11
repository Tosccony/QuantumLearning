"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speak";

/** Qubit the Robot: a small navy-ink probe with ice outlines, one visor and a flag on its antenna. */
export function QubitBot({ size = 96, mood = "happy" }: { size?: number; mood?: "happy" | "wow" }) {
  const reduce = useReducedMotion();
  const wow = mood === "wow";
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={reduce ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Qubit the Robot"
    >
      {/* antenna with a folded tape flag */}
      <line x1="50" y1="8" x2="50" y2="22" stroke="var(--ice)" strokeWidth="2.5" />
      <path d="M50 4h14v9l-7 5-7-5z" fill="var(--ice)" />
      <path d="M50 4h14v3H50z" fill="var(--ice-deep)" />
      {/* head */}
      <rect x="22" y="22" width="56" height="40" fill="var(--navy-ink)" stroke="var(--ice)" strokeWidth="2.5" />
      {/* visor: one ice band that blinks */}
      <motion.g
        animate={reduce ? undefined : { scaleY: [1, 1, 0.08, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
        style={{ originX: "50px", originY: wow ? "41px" : "39px" }}
      >
        <rect x="30" y={wow ? 32 : 34} width="40" height={wow ? 18 : 11} fill="var(--ice)" />
        <rect x="37" y={wow ? 37 : 37} width="6" height={wow ? 8 : 5} fill="var(--navy-ink)" />
        <rect x="57" y={wow ? 37 : 37} width="6" height={wow ? 8 : 5} fill="var(--navy-ink)" />
      </motion.g>
      {/* mouth */}
      {wow ? (
        <rect x="45" y="53" width="10" height="6" fill="none" stroke="var(--ice)" strokeWidth="2" />
      ) : (
        <path d="M42 55h16" stroke="var(--ice)" strokeWidth="2" strokeLinecap="square" />
      )}
      {/* neck */}
      <rect x="44" y="62" width="12" height="6" fill="var(--ice)" />
      {/* body with a three-cell chest readout */}
      <rect x="28" y="68" width="44" height="26" fill="var(--navy-ink)" stroke="var(--ice)" strokeWidth="2.5" />
      <rect x="36" y="77" width="8" height="8" fill="var(--ice)" />
      <rect x="46" y="77" width="8" height="8" fill="none" stroke="var(--ice)" strokeWidth="1.5" />
      <rect x="56" y="77" width="8" height="8" fill="var(--ice)" />
      {/* arms */}
      <rect x="14" y="71" width="12" height="6" fill="var(--ice)" />
      <rect x="74" y="71" width="12" height="6" fill="var(--ice)" />
    </motion.svg>
  );
}

/** Qubit with a speech window. The window doubles as captions for the voice narration. */
export default function Qubit({ text, mood }: { text: string; mood?: "happy" | "wow" }) {
  const { state } = useProgress();
  const narrate = state.settings.narration;

  useEffect(() => {
    if (narrate) speak(text);
  }, [text, narrate]);

  return (
    <div className="flex items-end gap-3">
      <div className="shrink-0">
        <QubitBot size={84} mood={mood} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="window relative mb-4 flex flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 text-lg leading-snug sm:text-xl"
          aria-live="polite"
        >
          <span className="absolute -left-3 bottom-5 h-3 w-3 bg-paper" aria-hidden />
          <span className="min-w-0 flex-1">{text.replace(/\p{Extended_Pictographic}[\uFE0F\u200D]*/gu, "").trim()}</span>
          <button
            type="button"
            onClick={() => speak(text)}
            className="keycap-paper !min-h-11 !px-3 !py-2"
            aria-label="Read this out loud"
            title="Read out loud"
          >
            <Icon name="sound" size={18} />
            <span className="hidden sm:inline">Read out loud</span>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
