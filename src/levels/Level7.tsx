"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Chandelier3D from "@/components/Chandelier3D";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import Icon from "@/components/ui/Icon";
import { Mark } from "@/components/ui/primitives";

const LABS = [
  {
    id: "ibm",
    who: "IBM",
    icon: "🏙️",
    fact: "IBM builds quantum computers from tiny superconducting circuits, and lets students and scientists run real programs on them over the internet!",
  },
  {
    id: "google",
    who: "Google",
    icon: "🧪",
    fact: "Google's Willow chip (2024) has 105 qubits. It solved a test puzzle in minutes that would take a normal supercomputer longer than the age of the universe!",
  },
  {
    id: "microsoft",
    who: "Microsoft",
    icon: "🧲",
    fact: "Microsoft is building a brand-new kind of qubit called a topological qubit. Its Majorana 1 chip (2025) is an early step — the idea is qubits that are harder to disturb.",
  },
];

/** A punched navy cell carrying the grease-cross "done" mark, for use on paper. */
function DoneCell() {
  return (
    <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center bg-navy-ink" role="img" aria-label="Done">
      <Mark kind="done" size={18} />
    </span>
  );
}

function VirtualLab({ done, say }: StepApi) {
  const [seen, setSeen] = useState<string[]>([]);
  const visit = (id: string) => {
    const lab = LABS.find((l) => l.id === id)!;
    const s = seen.includes(id) ? seen : [...seen, id];
    setSeen(s);
    say(lab.fact);
    if (s.length === LABS.length) done();
  };
  return (
    <div className="flex w-full flex-col items-center gap-5 md:flex-row md:items-start">
      <div className="flex w-full flex-col items-center gap-3">
        {/* The 3D fridge sits in a square navy frame; the model's own rounded/gradient box is squared off here. */}
        <div className="w-full max-w-sm border-2 border-navy-ink bg-navy-ink [&>div]:rounded-none [&>div]:bg-none [&>div]:bg-navy-ink">
          <Chandelier3D accent="#6fe6ff" />
        </div>
        <p className="text-center text-[#46587a]">Drag to spin! This golden “chandelier” is a super-cold fridge. The quantum chip lives at the very bottom.</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {LABS.map((l) => {
          const visited = seen.includes(l.id);
          return (
            <motion.button
              key={l.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => visit(l.id)}
              aria-pressed={visited}
              className={`flex min-h-20 items-center gap-4 border-2 bg-paper-2 p-4 text-left text-xl ${visited ? "border-good" : "border-paper-3 hover:border-navy-ink"}`}
            >
              <span className="text-4xl leading-none" aria-hidden>{l.icon}</span>
              Visit the {l.who} lab
              {visited && <DoneCell />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const TEMPS = [
  { place: "Your freezer", icon: "🧊", c: -18 },
  { place: "Antarctica's coldest day", icon: "🐧", c: -89 },
  { place: "Outer space", icon: "🌌", c: -270 },
  { place: "Quantum computer fridge", icon: "💎", c: -273 },
];

function ColdChallenge({ done, say }: StepApi) {
  const [k, setK] = useState(0);
  const cool = () => {
    const n = Math.min(k + 1, TEMPS.length - 1);
    setK(n);
    if (n === TEMPS.length - 1) {
      say("Brrr! Quantum chips must be colder than outer space! Even tiny wiggles of heat can make qubits forget their magic. 🥶");
      done();
    } else say(`${TEMPS[n].place}: about ${TEMPS[n].c}°C. Colder! Keep going!`);
  };
  const pct = (Math.abs(TEMPS[k].c) / 273) * 100;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      {/* Thermometer: a tall cell that fills with ice from the top as it gets colder. */}
      <div className="relative h-72 w-16 overflow-hidden border-2 border-navy-ink" style={{ background: "var(--bad)" }} role="img" aria-label={`About ${TEMPS[k].c} degrees Celsius`}>
        <motion.div className="absolute inset-x-0 top-0 bg-ice" animate={{ height: `${pct}%` }} />
      </div>
      <div className="flex flex-col gap-3">
        {TEMPS.map((t, j) => (
          <div key={t.place} className={`flex items-center gap-3 border p-3 text-xl ${j <= k ? "border-paper-3 bg-paper-2" : "border-transparent opacity-30"}`}>
            <span className="text-4xl leading-none" aria-hidden>{t.icon}</span>
            <span>{t.place}</span>
            <b className="code ml-auto">{t.c}°C</b>
          </div>
        ))}
        <button type="button" className="keycap-xl keycap-paper-primary" onClick={cool} disabled={k === TEMPS.length - 1}>
          <Icon name="cold" size={22} />
          Make it colder
        </button>
      </div>
    </div>
  );
}

const DREAMS = [
  { icon: "💊", label: "Invent new medicines" },
  { icon: "🔋", label: "Design super batteries" },
  { icon: "🌱", label: "Help fight climate change" },
  { icon: "🔐", label: "Build unbreakable codes" },
];

function FutureDream({ done, say }: StepApi) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {DREAMS.map((d, k) => (
        <motion.button
          key={d.label}
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setPick(k);
            say(`Great choice! Scientists hope quantum computers will help us ${d.label.toLowerCase()}. Maybe YOU will be the one to do it! 🌟`);
            done();
          }}
          aria-pressed={pick === k}
          className={`flex min-h-24 items-center gap-4 border-2 bg-paper-2 p-4 text-left text-xl ${pick === k ? "border-navy-ink" : "border-paper-3 hover:border-navy-ink"}`}
        >
          <span className="text-5xl leading-none" aria-hidden>{d.icon}</span>
          {d.label}
          {pick === k && <DoneCell />}
        </motion.button>
      ))}
    </div>
  );
}

export default function Level7() {
  return (
    <LessonShell
      planetId={7}
      steps={[
        { say: "Welcome to Future Station! Real scientists are building quantum computers RIGHT NOW. Visit all three labs!", render: (a) => <VirtualLab {...a} /> },
        { say: "Quantum chips need to be VERY cold. How cold? Let's find out!", render: (a) => <ColdChallenge {...a} /> },
        { say: "Last mission, explorer: what would YOU use a quantum computer for?", render: (a) => <FutureDream {...a} /> },
      ]}
      quiz={[
        { q: "Are real quantum computers being built today?", options: [{ icon: "🏗️", label: "Yes! By scientists around the world" }, { icon: "📚", label: "No, only in stories" }], answer: 0, why: "IBM, Google, Microsoft and many others are building them." },
        { q: "Why are quantum computers kept so cold?", options: [{ icon: "🥶", label: "Heat disturbs the qubits" }, { icon: "🍦", label: "To store ice cream" }], answer: 0, why: "Cold keeps qubits calm so they can do their magic." },
        { q: "What could quantum computers help with?", options: [{ icon: "💊", label: "Discovering new medicines" }, { icon: "🧦", label: "Finding lost socks" }], answer: 0, why: "Simulating molecules could help invent new medicines." },
      ]}
    />
  );
}
