"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import Icon from "@/components/ui/Icon";
import { groverCircuit, runCircuit } from "@/lib/quantum";
import { OFFLINE_MSG } from "@/lib/useShots";

const N = 16;
const WOOD = "#8a5a3c";

/** A door cell. `glow` (0–4) follows the real probability of that door and brightens it toward the star colour. */
function Door({ open, star, glow = 0, onClick, dim }: { open: boolean; star: boolean; glow?: number; onClick?: () => void; dim?: boolean }) {
  const closedBg = glow > 0 ? `color-mix(in srgb, var(--on) ${Math.round(glow * 20)}%, ${WOOD})` : WOOD;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick || open}
      animate={{ opacity: dim ? 0.35 : 1, borderColor: glow >= 2 ? "var(--on)" : "var(--navy-ink)" }}
      className="flex aspect-[3/4] min-h-11 items-center justify-center border-2 text-3xl leading-none sm:text-4xl"
      style={{ background: open ? (star ? "var(--on)" : "var(--off)") : closedBg, color: open && !star ? "var(--fog)" : undefined }}
      aria-label={open ? (star ? "Star found" : "Empty") : "Closed door"}
    >
      {open ? (star ? "⭐" : "·") : <span className="ml-[45%] h-[12%] w-[12%] bg-on" aria-hidden />}
    </motion.button>
  );
}

function YouSearch({ done, say }: StepApi) {
  const [star] = useState(() => Math.floor(Math.random() * N));
  const [opened, setOpened] = useState<number[]>([]);
  const found = opened.includes(star);
  const open = (k: number) => {
    if (found) return;
    const o = [...opened, k];
    setOpened(o);
    if (k === star) {
      say(`Found it in ${o.length} ${o.length === 1 ? "try" : "tries"}! A normal computer searches like this — one door at a time. 🚪`);
      done();
    } else say(`Empty! ${o.length} door${o.length > 1 ? "s" : ""} checked. Keep going!`);
  };
  return (
    <div className="grid w-full max-w-sm grid-cols-4 gap-2">
      {Array.from({ length: N }, (_, k) => (
        <Door key={k} open={opened.includes(k)} star={k === star} onClick={() => open(k)} />
      ))}
    </div>
  );
}

function Race({ done, say }: StepApi) {
  const [star, setStar] = useState(() => Math.floor(Math.random() * N));
  const [running, setRunning] = useState(false);
  const [cOpen, setCOpen] = useState(0); // classical robot has opened doors 0..cOpen-1
  const [qStep, setQStep] = useState(-1); // -1 idle, 0 superposition, 1-3 boosts, 4 open
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Real 4-qubit Grover search: probabilities after 0..3 iterations, plus one measured shot at the end.
  const [probs, setProbs] = useState<number[][]>([]);
  const [found, setFound] = useState<number | null>(null);

  const go = async () => {
    const s = Math.floor(Math.random() * N);
    let steps: number[][], shot: number;
    try {
      const runs = await Promise.all([0, 1, 2, 3].map((k) => runCircuit(groverCircuit(4, s, k), { shots: 1, memory: true })));
      steps = runs.map((r) => Array.from({ length: N }, (_, d) => r.probabilities[d.toString(2).padStart(4, "0")] ?? 0));
      shot = parseInt(runs[3].memory![0], 2);
    } catch {
      return say(OFFLINE_MSG);
    }
    setProbs(steps);
    setFound(shot);
    setStar(s);
    setCOpen(0);
    setQStep(0);
    setRunning(true);
    say("Ready, set, GO! 🏁");
    const t = timers.current;
    for (let k = 1; k <= s + 1; k++) t.push(setTimeout(() => setCOpen(k), k * 450));
    for (let k = 1; k <= 4; k++) t.push(setTimeout(() => setQStep(k), k * 900));
    t.push(
      setTimeout(() => {
        setRunning(false);
        say(
          shot === s
            ? `The quantum robot needed just 3 magic boosts (${Math.round(steps[3][s] * 100)}% sure!). The classical robot opened ${s + 1} door${s ? "s" : ""}! With a MILLION doors, the classical robot might need a million tries — the quantum one only about 800! 🤯`
            : `Whoa — the quantum robot was ${Math.round(steps[3][s] * 100)}% sure, but this time it opened the wrong door! Quantum answers are about chances. Race again! 🎲`,
        );
        done();
      }, Math.max(s + 1, 4) * 450 + 1200),
    );
  };

  // Glow follows the real probability of each door after each Grover iteration.
  const glowFor = (k: number) => (qStep < 0 || !probs.length ? 0 : Math.min(probs[Math.min(qStep, 3)][k] * 8, 4));

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="grid w-full gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="display flex items-center gap-2 text-xl"><Icon name="chip" size={20} /> Classical robot</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: N }, (_, k) => <Door key={k} open={k < cOpen} star={k === star} />)}
          </div>
          <p className="text-lg">Doors opened: <b className="code">{cOpen}</b></p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="display flex items-center gap-2 text-xl"><Icon name="atom" size={20} /> Quantum robot</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: N }, (_, k) => (
              <Door key={k} open={qStep === 4 && k === found} star={k === star} glow={glowFor(k)} dim={qStep >= 2 && probs.length > 0 && probs[Math.min(qStep, 3)][k] < 0.05} />
            ))}
          </div>
          <p className="text-lg" aria-live="polite">
            {qStep < 0 ? "Waiting…" : qStep === 0 ? "Checking ALL doors at once (superposition)…" : qStep < 4 ? `Magic boost ${qStep} of 3` : "Found it!"}
          </p>
        </div>
      </div>
      <button type="button" className="keycap-xl keycap-paper-primary" onClick={go} disabled={running}>
        <Icon name={qStep < 0 ? "run" : "reset"} size={20} />
        {qStep < 0 ? "Start the race" : "Race again"}
      </button>
    </div>
  );
}

export default function Level6() {
  return (
    <LessonShell
      planetId={6}
      steps={[
        { say: "A star is hidden behind one of these 16 doors. Find it! Tap one door at a time.", render: (a) => <YouSearch {...a} /> },
        { say: "Now watch a race! The quantum robot uses superposition to look at all doors, then makes the right one glow brighter and brighter.", render: (a) => <Race {...a} /> },
      ]}
      quiz={[
        { q: "How does the classical robot search?", options: [{ icon: "🚶", label: "One door at a time" }, { icon: "🌐", label: "All doors at once" }], answer: 0, why: "Normal computers check things one by one." },
        { q: "The quantum robot makes the right answer…", options: [{ icon: "🌟", label: "Glow brighter and brighter" }, { icon: "🫥", label: "Disappear" }], answer: 0, why: "Quantum algorithms boost the right answer's chance." },
        { q: "Are quantum computers faster at EVERYTHING?", options: [{ icon: "🙅", label: "No — only some special problems" }, { icon: "🏎️", label: "Yes, at every single thing" }], answer: 0, why: "They're super fast at some puzzles, not all of them." },
      ]}
    />
  );
}
