"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Flag, Mark } from "@/components/ui/primitives";
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
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/explorer" className="keycap !px-3" aria-label="Back to the mission map">
          <Icon name="back" size={20} />
          <span className="hidden sm:inline">Map</span>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="display text-2xl sm:text-3xl" style={{ color: planet.color }}>{planet.name}</h1>
            <EdgeCode>P{String(planet.id).padStart(2, "0")} · {planet.concept}</EdgeCode>
          </div>
        </div>
        {EXPLORER_CIRCUITS[planetId] && (
          <Link
            href={`${labLink(EXPLORER_CIRCUITS[planetId])}&from=${encodeURIComponent(`Explorer: ${planet.name}`)}`}
            className="keycap hidden sm:inline-flex"
            title="See the real quantum circuit behind this game in the Lab"
          >
            <Icon name="chip" size={18} />
            Real circuit
          </Link>
        )}
        <ol className="flex gap-1.5 pt-2" aria-label={`Step ${pos + 1} of ${total}`}>
          {Array.from({ length: total }, (_, k) => {
            const done = k < pos;
            const current = k === pos;
            return (
              <li key={k} className={`frame relative grid h-6 w-8 place-items-center ${current ? "frame-active" : ""}`} aria-hidden>
                {current && <Flag className="absolute -top-[9px] left-1" width={11} />}
                {done && <Mark kind="done" size={13} />}
              </li>
            );
          })}
        </ol>
      </header>

      {phase !== "reward" && <Qubit text={line} />}

      <AnimatePresence mode="wait">
        {phase === "steps" && (
          <motion.section
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="window flex flex-col items-center gap-6 p-5 sm:p-8"
            aria-label={`Step ${i + 1}`}
          >
            {steps[i].render({ done: () => setStepDone(true), say: setLine })}
            <button type="button" className="keycap-xl keycap-paper-primary w-full sm:w-auto" disabled={!stepDone} onClick={next}>
              {stepDone ? "Next" : "Try it first"}
              {stepDone && <Icon name="next" size={20} />}
            </button>
          </motion.section>
        )}
        {phase === "quiz" && (
          <motion.section key="quiz" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="window p-5 sm:p-8" aria-label="Quiz">
            <Quiz questions={quiz} onSay={setLine} onFinish={finishQuiz} />
          </motion.section>
        )}
        {phase === "reward" && <Reward key="reward" planet={planet} score={score} total={quiz.length} />}
      </AnimatePresence>
    </main>
  );
}
