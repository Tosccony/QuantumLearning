"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import { runCircuit } from "@/lib/quantum";
import { OFFLINE_MSG } from "@/lib/useShots";

const SPOTS = [
  { x: 15, y: 25, name: "Palm Beach", icon: "🌴" },
  { x: 70, y: 18, name: "Volcano", icon: "🌋" },
  { x: 45, y: 55, name: "Cave", icon: "🪨" },
  { x: 18, y: 75, name: "Shipwreck", icon: "⚓" },
  { x: 78, y: 70, name: "Waterfall", icon: "💧" },
];

function SplitChest({ done, say }: StepApi) {
  const [split, setSplit] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-56 w-full max-w-md">
        {SPOTS.map((s, k) => (
          <motion.div
            key={k}
            className="absolute text-6xl"
            initial={false}
            animate={split ? { left: `${s.x}%`, top: `${s.y}%`, opacity: 0.55, scale: 0.9 } : { left: "45%", top: "35%", opacity: k === 0 ? 1 : 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 80, delay: k * 0.05 }}
            style={{ filter: split ? "drop-shadow(0 0 14px var(--accent))" : "none", translate: "-50% -50%" }}
            aria-hidden
          >
            🧰
          </motion.div>
        ))}
      </div>
      <button
        className="btn-primary"
        onClick={() => {
          setSplit(!split);
          if (!split) {
            say("Whoa! In quantum land, the treasure can be in MANY places at once. That's called SUPERPOSITION! 🌟");
            done();
          } else say("Back to one normal chest. Tap again to make it quantum!");
        }}
      >
        {split ? "Make it normal 📦" : "Make it quantum ✨"}
      </button>
    </div>
  );
}

function randomWeights() {
  const w = [0.4, 0.25, 0.15, 0.12, 0.08];
  for (let k = w.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [w[k], w[j]] = [w[j], w[k]];
  }
  return w;
}

function TreasureHunt({ done, say }: StepApi) {
  const [round, setRound] = useState(0);
  const weights = useMemo(randomWeights, [round]);
  const [result, setResult] = useState<{ pick: number; at: number } | null>(null);
  const [found, setFound] = useState(0);

  const [busy, setBusy] = useState(false);

  // The cloud is a real 3-qubit state: spot k has amplitude sqrt(weight k) on basis state |k⟩.
  // Looking = one measured shot from Qiskit.
  const look = async (pick: number) => {
    if (result || busy) return;
    setBusy(true);
    let at: number;
    try {
      const amps = [...weights.map(Math.sqrt), 0, 0, 0];
      const r = await runCircuit({ qubits: 3, ops: [{ gate: "initialize", targets: [0, 1, 2], params: amps }] }, { shots: 1, memory: true });
      at = parseInt(r.memory![0], 2);
    } catch {
      setBusy(false);
      return say(OFFLINE_MSG);
    }
    setBusy(false);
    setResult({ pick, at });
    const win = at === pick;
    if (win) setFound((f) => f + 1);
    say(
      win
        ? `Treasure! 💰 You looked at the ${SPOTS[pick].name} and the cloud popped right there!`
        : `The cloud popped at the ${SPOTS[at].name}! Big clouds are more likely, but never certain. 🎲`,
    );
    if (round + 1 >= 4) setTimeout(done, 400);
  };

  const nextRound = () => {
    setResult(null);
    setRound((r) => r + 1);
    say("New island, new clouds! Bigger cloud = better chance. Where will you look?");
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full justify-between text-lg">
        <span>Round {Math.min(round + 1, 4)} of 4</span>
        <span>💰 Found: {found}</span>
      </div>
      <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#1e88a8] to-[#156b85]">
        <div className="absolute inset-[8%] rounded-[45%] bg-[#e7c27d]" aria-hidden />
        {SPOTS.map((s, k) => {
          const size = 50 + weights[k] * 260;
          const show = !result || result.at === k;
          return (
            <button
              key={`${round}-${k}`}
              onClick={() => look(k)}
              disabled={!!result}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${s.x + 6}%`, top: `${s.y + 6}%` }}
              aria-label={`Look at the ${s.name}, about ${Math.round(weights[k] * 100)} percent chance`}
            >
              <AnimatePresence>
                {show && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={result ? { scale: 0.6, opacity: 1 } : { scale: [1, 1.08, 1], opacity: 0.85 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={result ? { type: "spring" } : { duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: size,
                      height: size,
                      background: result ? "transparent" : "radial-gradient(circle, #fff 0%, color-mix(in srgb, var(--accent) 85%, white) 30%, color-mix(in srgb, var(--accent) 60%, transparent) 55%, transparent 72%)",
                    }}
                  >
                    {result ? <span className="text-6xl">{result.at === result.pick ? "💰" : "🧰"}</span> : <span className="text-3xl">{s.icon}</span>}
                  </motion.span>
                )}
              </AnimatePresence>
              {result?.pick === k && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl">👀</span>}
              {result && result.at !== k && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl opacity-50">{s.icon}</span>}
            </button>
          );
        })}
      </div>
      {result && round < 3 && <button className="btn-ghost" onClick={nextRound}>New island 🏝️</button>}
    </div>
  );
}

export default function Level3() {
  return (
    <LessonShell
      planetId={3}
      steps={[
        { say: "Here on Planet Maybe, a treasure chest is hiding. Tap the button to give it quantum powers!", render: (a) => <SplitChest {...a} /> },
        { say: "The glowing clouds show where the treasure MIGHT be. Tap a cloud to look there!", render: (a) => <TreasureHunt {...a} /> },
      ]}
      quiz={[
        { q: "Superposition means a qubit can…", options: [{ icon: "✨", label: "Be in many possibilities at once" }, { icon: "🧊", label: "Freeze in place" }, { icon: "🐌", label: "Go very slowly" }], answer: 0, why: "Superposition = many possibilities at the same time." },
        { q: "What does a BIGGER cloud mean?", options: [{ icon: "🎯", label: "More likely to be found there" }, { icon: "🚫", label: "It can't be there" }], answer: 0, why: "Bigger cloud = higher chance." },
        { q: "When you look, the cloud…", options: [{ icon: "💥", label: "Pops into one spot" }, { icon: "☁️", label: "Gets even bigger" }], answer: 0, why: "Looking makes the superposition pick one answer." },
      ]}
    />
  );
}
