"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speak";

export function QubitBot({ size = 96, mood = "happy" }: { size?: number; mood?: "happy" | "wow" }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Qubit the Robot"
    >
      <line x1="50" y1="8" x2="50" y2="22" stroke="#cfd6ff" strokeWidth="3" />
      <motion.circle
        cx="50" cy="8" r="6" fill="var(--on)"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <rect x="18" y="22" width="64" height="48" rx="18" fill="#dfe5ff" />
      <rect x="25" y="30" width="50" height="30" rx="12" fill="#1b2160" />
      <motion.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ originY: "45px" }}>
        <circle cx="40" cy="45" r={mood === "wow" ? 6 : 5} fill="#7bdff2" />
        <circle cx="60" cy="45" r={mood === "wow" ? 6 : 5} fill="#7bdff2" />
      </motion.g>
      {mood === "wow" ? (
        <circle cx="50" cy="55" r="3" fill="#ff8fab" />
      ) : (
        <path d="M43 53 Q50 58 57 53" stroke="#ff8fab" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      <rect x="30" y="72" width="40" height="20" rx="8" fill="#b8c0f0" />
      <circle cx="50" cy="82" r="5" fill="var(--accent)" />
      <rect x="8" y="40" width="10" height="20" rx="5" fill="#b8c0f0" />
      <rect x="82" y="40" width="10" height="20" rx="5" fill="#b8c0f0" />
    </motion.svg>
  );
}

/** Qubit with a speech bubble. The bubble doubles as captions for the voice narration. */
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
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="relative mb-4 flex-1 rounded-3xl rounded-bl-md bg-white px-5 py-4 text-lg leading-snug text-[#1b2160] shadow-lg sm:text-xl"
          aria-live="polite"
        >
          {text}
          <button
            onClick={() => speak(text)}
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0ff] align-middle text-base"
            aria-label="Read this out loud"
            title="Read out loud"
          >
            🔊
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
