"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import { runCircuit, type Op } from "@/lib/quantum";
import { OFFLINE_MSG } from "@/lib/useShots";

/** Four kid-sized qubit states: arrow up (0), down (1), right (+ "both"), left (− "both, flipped"). */
type Q = "0" | "1" | "+" | "-";
type Gate = "X" | "H" | "Z";

const ANGLE: Record<Q, number> = { "0": 0, "+": 90, "1": 180, "-": 270 };
const LABEL: Record<Q, string> = { "0": "0", "1": "1", "+": "both +", "-": "both −" };

/** Reads the kid-sized state off Qiskit's Bloch vector (x, y, z). */
const fromBloch = ([x, , z]: number[]): Q => (z > 0.9 ? "0" : z < -0.9 ? "1" : x > 0 ? "+" : "-");

/** Runs start-state prep + gates on Qiskit and returns the qubit state after every gate. */
async function simulate(start: Q, gates: Gate[]): Promise<Q[]> {
  const prep: Op[] = { "0": [], "1": [{ gate: "x", targets: [0] }], "+": [{ gate: "h", targets: [0] }], "-": [{ gate: "x", targets: [0] }, { gate: "h", targets: [0] }] }[start] as Op[];
  const ops: Op[] = [...prep, ...gates.map((g) => ({ gate: g.toLowerCase() as Op["gate"], targets: [0] }))];
  const r = await runCircuit({ qubits: 1, ops }, { shots: 1, trace: true });
  return r.trace!.slice(prep.length).map((b) => fromBloch(b[0]));
}

const GATES: Record<Gate, { color: string; name: string; does: string }> = {
  X: { color: "#ff9f1c", name: "X Gate — the Flipper", does: "flips 0 ↔ 1" },
  H: { color: "#7b6cff", name: "H Gate — the Mixer", does: "makes a superposition (and back)" },
  Z: { color: "#2ec4ff", name: "Z Gate — the Twister", does: "twists 'both +' ↔ 'both −'" },
};

function QubitDial({ q, size = 150 }: { q: Q; size?: number }) {
  const both = q === "+" || q === "-";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-full border-4 border-white/30"
        style={{ width: size, height: size, background: both ? "radial-gradient(circle, color-mix(in srgb, var(--accent) 50%, transparent), transparent 70%)" : "transparent" }}
        role="img"
        aria-label={`Qubit is ${LABEL[q]}`}
      >
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-sm text-muted">0</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm text-muted">1</span>
        <motion.div className="absolute inset-0" animate={{ rotate: ANGLE[q] }} transition={{ type: "spring", stiffness: 90, damping: 12 }}>
          <div className="absolute left-1/2 top-[12%] h-[38%] w-2 -translate-x-1/2 rounded-full bg-on" />
          <div className="absolute left-1/2 top-[6%] -translate-x-1/2 border-x-[10px] border-b-[16px] border-x-transparent border-b-on" />
        </motion.div>
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <span className="text-xl font-bold">{LABEL[q]}</span>
    </div>
  );
}

function GateTour({ done, say }: StepApi) {
  const [q, setQ] = useState<Q>("0");
  const [tried, setTried] = useState<Set<Gate>>(new Set());
  const press = async (g: Gate) => {
    let nq: Q;
    try {
      nq = (await simulate(q, [g]))[0];
    } catch {
      return say(OFFLINE_MSG);
    }
    setQ(nq);
    const t = new Set(tried).add(g);
    setTried(t);
    say(
      nq === q
        ? `The ${g} gate didn't change ${LABEL[q]}. Some gates only work on certain qubits — try a different one!`
        : `${GATES[g].name} ${GATES[g].does}: ${LABEL[q]} → ${LABEL[nq]}!`,
    );
    if (t.size === 3) done();
  };
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <QubitDial q={q} />
      <div className="flex flex-col gap-3">
        {(Object.keys(GATES) as Gate[]).map((g) => (
          <button key={g} onClick={() => press(g)} className="btn justify-start text-left text-white" style={{ background: GATES[g].color }}>
            <span className="text-3xl font-black">{g}</span>
            <span className="text-base font-normal">{GATES[g].does} {tried.has(g) && "✓"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const CHALLENGES: { start: Q; target: Q; hint: string; only?: Gate[] }[] = [
  { start: "0", target: "1", hint: "Which gate is the Flipper?" },
  { start: "0", target: "+", hint: "Which gate makes a superposition?" },
  { start: "+", target: "-", hint: "Which gate twists 'both'?" },
  { start: "0", target: "1", hint: "Expert! No X allowed. Mix, twist, mix…", only: ["H", "Z"] },
];

function GateMachine({ done, say }: StepApi) {
  const [c, setC] = useState(0);
  const [slots, setSlots] = useState<Gate[]>([]);
  const [q, setQ] = useState<Q>(CHALLENGES[0].start);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const ch = CHALLENGES[c];
  const allowed = ch.only ?? (["X", "H", "Z"] as Gate[]);

  const add = (g: Gate) => {
    if (running || slots.length >= 4 || !allowed.includes(g)) return;
    setSlots([...slots, g]);
  };

  const run = async () => {
    setRunning(true);
    let cur = ch.start;
    setQ(cur);
    let states: Q[];
    try {
      states = await simulate(ch.start, slots);
    } catch {
      setRunning(false);
      return say(OFFLINE_MSG);
    }
    for (const st of states) {
      await new Promise((r) => setTimeout(r, 750));
      cur = st;
      setQ(cur);
    }
    await new Promise((r) => setTimeout(r, 500));
    setRunning(false);
    if (cur === ch.target) {
      setSolved(true);
      say(c === CHALLENGES.length - 1 ? "WOW! H → Z → H makes a flip without X! You're a real Gate Engineer! 🏗️" : "It worked! The machine made exactly the right qubit! 🎉");
      if (c === CHALLENGES.length - 1) done();
    } else say(`The machine made ${LABEL[cur]}, but we need ${LABEL[ch.target]}. Clear it and try again! ${ch.hint}`);
  };

  const nextChallenge = () => {
    const n = c + 1;
    setC(n);
    setSlots([]);
    setSolved(false);
    setQ(CHALLENGES[n].start);
    say(CHALLENGES[n].only ? "Final challenge: make 1 from 0 using only H and Z! 🧠" : `Challenge ${n + 1}: turn ${LABEL[CHALLENGES[n].start]} into ${LABEL[CHALLENGES[n].target]}!`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-lg text-muted">
        Challenge {c + 1} of {CHALLENGES.length}: turn <b className="text-ink">{LABEL[ch.start]}</b> into <b className="text-ink">{LABEL[ch.target]}</b>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <QubitDial q={q} size={120} />
        <div
          className="flex min-h-24 min-w-64 items-center gap-2 rounded-3xl border-4 border-dashed border-white/30 bg-space-2 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => add(e.dataTransfer.getData("gate") as Gate)}
          aria-label="Gate machine slots"
        >
          {slots.length === 0 && <span className="px-2 text-muted">Drag or tap gates here</span>}
          {slots.map((g, k) => (
            <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black text-white" style={{ background: GATES[g].color }}>
              {g}
            </motion.span>
          ))}
        </div>
        <div className="flex flex-col items-center opacity-80" aria-label={`Target: ${LABEL[ch.target]}`}>
          <span className="text-sm">🎯 Target</span>
          <QubitDial q={ch.target} size={80} />
        </div>
      </div>
      <div className="flex gap-3">
        {(Object.keys(GATES) as Gate[]).map((g) => (
          <button
            key={g}
            draggable={allowed.includes(g)}
            onDragStart={(e) => e.dataTransfer.setData("gate", g)}
            onClick={() => add(g)}
            disabled={!allowed.includes(g) || running}
            className="flex h-20 w-20 cursor-grab items-center justify-center rounded-2xl text-4xl font-black text-white shadow-lg disabled:opacity-25"
            style={{ background: GATES[g].color }}
            aria-label={`Add ${GATES[g].name}`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn-ghost" onClick={() => { setSlots([]); setQ(ch.start); }} disabled={running}>🧹 Clear</button>
        <button className="btn-primary" onClick={run} disabled={running || slots.length === 0 || solved}>▶️ Run machine</button>
        {solved && c < CHALLENGES.length - 1 && <button className="btn-primary" onClick={nextChallenge}>Next challenge ➜</button>}
      </div>
    </div>
  );
}

export default function Level5() {
  return (
    <LessonShell
      planetId={5}
      steps={[
        { say: "Welcome to Gearworld! Quantum computers change qubits with GATES. The arrow shows your qubit. Try all three gates!", render: (a) => <GateTour {...a} /> },
        { say: "Now build a machine! Put gates in the slots, then press Run. Challenge 1: turn 0 into 1!", render: (a) => <GateMachine {...a} /> },
      ]}
      quiz={[
        { q: "Which gate flips 0 into 1?", options: [{ icon: "🟧", label: "X Gate" }, { icon: "🟪", label: "H Gate" }, { icon: "🟦", label: "Z Gate" }], answer: 0, why: "X is the Flipper." },
        { q: "Which gate makes a superposition?", options: [{ icon: "🟦", label: "Z Gate" }, { icon: "🟪", label: "H Gate" }], answer: 1, why: "H mixes 0 into 'both'." },
        { q: "A quantum program is…", options: [{ icon: "⚙️", label: "A list of gates in order" }, { icon: "🍕", label: "A pizza recipe" }], answer: 0, why: "Gates in a row make a quantum circuit!" },
      ]}
    />
  );
}
