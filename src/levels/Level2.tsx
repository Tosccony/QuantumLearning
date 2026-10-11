"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import Icon from "@/components/ui/Icon";
import { EXPLORER_CIRCUITS } from "@/lib/curriculum";
import { OFFLINE_MSG, useShots } from "@/lib/useShots";

/** A square token: one colour per face, both colours at once while the quantum coin spins. */
function Coin({ face, spinning, quantum }: { face: "H" | "T" | null; spinning: boolean; quantum?: boolean }) {
  const mixed = !!quantum && spinning;
  return (
    <motion.div
      animate={spinning ? { rotateY: [0, 360] } : { rotateY: 0 }}
      transition={spinning ? { duration: quantum ? 0.5 : 0.25, repeat: Infinity, ease: "linear" } : { type: "spring", stiffness: 160, damping: 18 }}
      className="display relative flex h-40 w-40 items-center justify-center overflow-hidden border-[3px] border-navy-ink text-5xl text-navy-ink"
      style={{ background: mixed ? "transparent" : face === "T" ? "var(--b)" : "var(--a)" }}
      aria-live="polite"
    >
      {mixed && (
        <span className="absolute inset-0 flex" aria-hidden>
          <span className="h-full w-1/2" style={{ background: "var(--a)" }} />
          <span className="h-full w-1/2" style={{ background: "var(--b)" }} />
        </span>
      )}
      <span className="relative">{spinning ? (quantum ? "H+T" : "?") : face === "H" ? "😀 H" : face === "T" ? "🐉 T" : "🪙"}</span>
    </motion.div>
  );
}

function NormalCoin({ done, say }: StepApi) {
  const [face, setFace] = useState<"H" | "T" | null>(null);
  const [flips, setFlips] = useState(0);
  const flip = () => {
    const f = Math.random() < 0.5 ? "H" : "T";
    setFace(f);
    setFlips(flips + 1);
    say(f === "H" ? "Heads! A normal coin lands on heads OR tails — just like a bit is 0 OR 1." : "Tails! Only one side at a time — just like a normal bit.");
    if (flips + 1 >= 2) done();
  };
  return (
    <div className="flex flex-col items-center gap-5">
      <Coin face={face} spinning={false} />
      <button type="button" className="keycap-xl keycap-paper-primary" onClick={flip}>
        <Icon name="reset" size={20} />
        Flip the normal coin
      </button>
    </div>
  );
}

function QuantumCoin({ done, say }: StepApi) {
  const [spinning, setSpinning] = useState(true);
  const [face, setFace] = useState<"H" | "T" | null>(null);
  const [tally, setTally] = useState({ H: 0, T: 0 });
  const shots = useShots(EXPLORER_CIRCUITS[2]); // H then measure, run on Qiskit

  const look = () => {
    const shot = shots.next();
    if (shot === null) return say(OFFLINE_MSG);
    const f = shot === "0" ? "H" : "T";
    setSpinning(false);
    setFace(f);
    const t = { ...tally, [f]: tally[f] + 1 };
    setTally(t);
    const n = t.H + t.T;
    if (n === 1) say("You looked — and POP! It picked one side. While spinning it was both possibilities at once! 👀");
    else if (n >= 6) {
      say(`After ${n} looks: ${t.H} heads and ${t.T} tails. You can't predict each look — that's quantum magic! 🎲`);
      done();
    } else say(`${f === "H" ? "Heads" : "Tails"} this time! Spin it again and look again.`);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <Coin face={face} spinning={spinning} quantum />
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="keycap-xl keycap-paper-primary" onClick={look} disabled={!spinning}>
          <Icon name="eye" size={20} />
          Look at it
        </button>
        <button
          type="button"
          className="keycap-xl keycap-paper"
          onClick={() => { setSpinning(true); say("Spinning again… it's both heads AND tails until you look! 🌀"); }}
          disabled={spinning}
        >
          <Icon name="reset" size={20} />
          Spin again
        </button>
      </div>
      <div className="flex gap-6 text-xl" aria-label="Results so far">
        <span>😀 Heads: <b className="code">{tally.H}</b></span>
        <span>🐉 Tails: <b className="code">{tally.T}</b></span>
      </div>
    </div>
  );
}

export default function Level2() {
  return (
    <LessonShell
      planetId={2}
      steps={[
        { say: "This is a normal coin. Flip it and see what happens!", render: (a) => <NormalCoin {...a} /> },
        { say: "Now meet the QUANTUM coin! It spins with both sides mixed together. That's a qubit! Look at it to make it choose.", render: (a) => <QuantumCoin {...a} /> },
      ]}
      quiz={[
        { q: "A normal bit is like a coin that's…", options: [{ icon: "1️⃣", label: "Heads OR tails" }, { icon: "🌀", label: "Both at once" }], answer: 0, why: "A normal bit is one or the other." },
        { q: "What happens when you look at a spinning qubit?", options: [{ icon: "🎯", label: "It picks one answer" }, { icon: "💥", label: "It explodes" }, { icon: "🌀", label: "Nothing changes" }], answer: 0, why: "Looking (measuring) makes it choose 0 or 1." },
        { q: "Before you look, a qubit can be…", options: [{ icon: "🌗", label: "A mix of 0 and 1" }, { icon: "0️⃣", label: "Only 0" }], answer: 0, why: "Qubits can hold both possibilities until observed." },
      ]}
    />
  );
}
