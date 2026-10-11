"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Mark } from "@/components/ui/primitives";

export type Question = { q: string; options: { icon: string; label: string }[]; answer: number; why: string };

/** Quiz lives inside the lesson window: paper surfaces, square option frames, state as marks. */
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

  const last = n === questions.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <p className="label text-[#46587a]">Question {n + 1} of {questions.length}</p>
      <h2 className="display text-2xl sm:text-3xl">{q.q}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const isAnswer = picked !== null && k === q.answer;
          const isWrong = picked !== null && k === picked && k !== q.answer;
          const dim = picked !== null && !isAnswer && !isWrong;
          const border = isAnswer ? "border-good" : isWrong ? "border-bad" : "border-paper-3 hover:border-navy-ink";
          return (
            <motion.button
              key={k}
              type="button"
              whileTap={picked === null ? { scale: 0.98 } : undefined}
              onClick={() => pick(k)}
              disabled={picked !== null}
              aria-pressed={picked === k}
              className={`relative flex min-h-20 items-center gap-4 border-2 bg-paper-2 p-4 text-left text-xl text-navy-ink transition-opacity ${border} ${dim ? "opacity-50" : ""}`}
            >
              <span className="text-4xl leading-none" aria-hidden>{o.icon}</span>
              <span className="flex-1">{o.label}</span>
              {isAnswer && (
                <span className="grid h-9 w-9 shrink-0 place-items-center bg-navy-ink" role="img" aria-label="Correct answer">
                  <Mark kind="done" size={18} />
                </span>
              )}
              {isWrong && <Icon name="close" size={22} className="shrink-0 text-bad" title="Not this one" />}
            </motion.button>
          );
        })}
      </div>
      {picked !== null && (
        <button type="button" className="keycap-xl keycap-paper-primary self-end" onClick={next}>
          {last ? "Get my badge" : "Next question"}
          <Icon name={last ? "badge" : "next"} size={20} />
        </button>
      )}
    </div>
  );
}
