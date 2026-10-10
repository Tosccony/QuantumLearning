"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export type Question = { q: string; options: { icon: string; label: string }[]; answer: number; why: string };

export default function Quiz({
  questions,
  onSay,
  onFinish,
}: {
  questions: Question[];
  onSay: (t: string) => void;
  onFinish: (correct: number) => void;
}) {
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = questions[n];

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const right = k === q.answer;
    if (right) setCorrect((c) => c + 1);
    onSay(right ? `Yes! ${q.why}` : `Good try! ${q.why}`);
  };

  const next = () => {
    if (n < questions.length - 1) {
      setN(n + 1);
      setPicked(null);
      onSay("Next question! 🤔");
    } else onFinish(correct);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">Question {n + 1} of {questions.length}</p>
      <h2 className="text-2xl font-bold">{q.q}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answer ? "ring-4 ring-good" : k === picked ? "ring-4 ring-bad opacity-80" : "opacity-50";
          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.96 }}
              onClick={() => pick(k)}
              className={`flex min-h-20 items-center gap-4 rounded-2xl bg-space-2 p-4 text-left text-xl ${state}`}
            >
              <span className="text-4xl" aria-hidden>{o.icon}</span>
              <span>{o.label}</span>
              {picked !== null && k === q.answer && <span className="ml-auto" aria-label="correct answer">✅</span>}
            </motion.button>
          );
        })}
      </div>
      {picked !== null && (
        <button className="btn-primary self-end" onClick={next}>
          {n < questions.length - 1 ? "Next question ➜" : "Get my badge! 🏅"}
        </button>
      )}
    </div>
  );
}
