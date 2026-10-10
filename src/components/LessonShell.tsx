"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EXPLORER_CIRCUITS } from "@/lib/curriculum";
import { PLANETS } from "@/lib/levels";
import { labLink } from "@/lib/quantum";
import { useProgress } from "@/lib/progress";
import Qubit from "./Qubit";
import Quiz, { type Question } from "./Quiz";
import Reward from "./Reward";

export type StepApi = { done: () => void; say: (text: string) => void };
export type Step = { say: string; render: (api: StepApi) => React.ReactNode };

export default function LessonShell({ planetId, steps, quiz }: { planetId: number; steps: Step[]; quiz: Question[] }) {
  const planet = PLANETS[planetId - 1];
  const { completeLevel, logTime, addXp } = useProgress();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"steps" | "quiz" | "reward">("steps");
  const [stepDone, setStepDone] = useState(false);
  const [line, setLine] = useState(steps[0].say);
  const [score, setScore] = useState(0);
  const started = useRef(Date.now());
  const logged = useRef(0);

  // Count minutes played in small chunks, so closing the tab mid-lesson loses at most 15s.
  useEffect(() => {
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      logTime((now - last) / 1000);
      last = now;
    };
    const id = setInterval(flush, 15000);
    return () => {
      clearInterval(id);
      flush();
    };
  }, [logTime]);

  const next = () => {
    addXp(10);
    if (i < steps.length - 1) {
      setI(i + 1);
      setStepDone(false);
      setLine(steps[i + 1].say);
    } else {
      setPhase("quiz");
      setLine("Quiz time! Show me what you discovered. 🧠");
    }
  };

  const finishQuiz = (correct: number) => {
    setScore(correct);
    const sec = Math.round((Date.now() - started.current) / 1000) - logged.current;
    logged.current += sec;
    completeLevel(planetId, correct, quiz.length, sec);
    setPhase("reward");
  };

  const total = steps.length + 1;
  const pos = phase === "steps" ? i : steps.length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6">
      <header className="flex items-center gap-3">
        <Link href="/explorer" className="btn-ghost !min-h-12 !px-4 !py-2 !text-lg" aria-label="Back to the galaxy map">
          ← Map
        </Link>
        <div className="flex-1">
          <p className="text-sm text-muted">Planet {planet.id} · {planet.concept}</p>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: planet.color }}>{planet.name}</h1>
        </div>
        {EXPLORER_CIRCUITS[planetId] && (
          <Link
            href={`${labLink(EXPLORER_CIRCUITS[planetId])}&from=${encodeURIComponent(`Explorer: ${planet.name}`)}`}
            className="hidden rounded-full bg-white/10 px-3 py-1 text-sm sm:block"
            title="See the real quantum circuit behind this game in the Lab"
          >
            🔬 Real circuit
          </Link>
        )}
        <ol className="flex gap-1.5" aria-label={`Step ${pos + 1} of ${total}`}>
          {Array.from({ length: total }, (_, k) => (
            <li key={k} className={`h-3 w-3 rounded-full sm:h-4 sm:w-4 ${k < pos ? "bg-good" : k === pos ? "bg-on" : "bg-white/20"}`} />
          ))}
        </ol>
      </header>

      {phase !== "reward" && <Qubit text={line} />}

      <AnimatePresence mode="wait">
        {phase === "steps" && (
          <motion.section
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="card flex flex-col items-center gap-5"
          >
            {steps[i].render({ done: () => setStepDone(true), say: setLine })}
            <button className="btn-primary w-full sm:w-auto" disabled={!stepDone} onClick={next}>
              {stepDone ? "Next ➜" : "Try it first! 👆"}
            </button>
          </motion.section>
        )}
        {phase === "quiz" && (
          <motion.section key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            <Quiz questions={quiz} onSay={setLine} onFinish={finishQuiz} />
          </motion.section>
        )}
        {phase === "reward" && <Reward key="reward" planet={planet} score={score} total={quiz.length} />}
      </AnimatePresence>
    </main>
  );
}
