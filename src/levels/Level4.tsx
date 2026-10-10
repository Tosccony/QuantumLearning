"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import { useProgress } from "@/lib/progress";
import { EXPLORER_CIRCUITS } from "@/lib/curriculum";
import { OFFLINE_MSG, useShots } from "@/lib/useShots";

type Color = "a" | "b" | null;
// Colour names follow the palette so colour-blind mode stays truthful.
function useNames() {
  const cb = useProgress().state.settings.colorblind;
  return cb ? { a: "Orange", b: "Blue" } : { a: "Pink", b: "Green" };
}
const PLACES = ["Same room 🏠", "The Moon 🌙", "Mars 🔴", "Another galaxy 🌌"];

function Twin({ color, label, shimmer }: { color: Color; label: string; shimmer: boolean }) {
  const NAME = useNames();
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={shimmer ? { background: ["var(--a)", "var(--b)", "var(--a)"], scale: [1, 1.06, 1] } : { background: color ? `var(--${color})` : "var(--off)", scale: 1 }}
        transition={shimmer ? { duration: 1.6, repeat: Infinity } : { type: "spring" }}
        className="flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-[0_0_30px_#fff4] sm:h-28 sm:w-28"
        aria-label={`${label}: ${shimmer ? "mixed, not decided yet" : color ? NAME[color] : "unknown"}`}
      >
        {shimmer ? "😊" : color ? "😄" : "😶"}
      </motion.div>
      <span className="text-lg font-semibold">{label}</span>
    </div>
  );
}

function Beam({ on, gap }: { on: boolean; gap: number }) {
  return (
    <div className="relative h-4 flex-1" style={{ minWidth: 40 + gap * 30 }}>
      {on && (
        <motion.div
          className="absolute inset-y-1 left-0 right-0 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--a), #fff, var(--b))" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function MeetTwins({ done, say }: StepApi) {
  const [linked, setLinked] = useState(false);
  const [dist, setDist] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full items-center justify-center">
        <Twin color={null} label="Twin A" shimmer={linked} />
        <Beam on={linked} gap={dist} />
        <Twin color={null} label="Twin B" shimmer={linked} />
      </div>
      {!linked ? (
        <button className="btn-primary" onClick={() => { setLinked(true); say("Zap! ⚡ They're ENTANGLED now — linked by a magic quantum bond. Slide them far apart!"); }}>
          ⚡ Entangle the twins
        </button>
      ) : (
        <label className="flex w-full max-w-md flex-col gap-2 text-lg">
          Move Twin B to: <b>{PLACES[dist]}</b>
          <input
            type="range"
            min={0}
            max={3}
            value={dist}
            onChange={(e) => {
              const d = +e.target.value;
              setDist(d);
              if (d === 3) {
                say("Even in another galaxy, the twins are still connected! Let's test it… 🌌");
                done();
              }
            }}
            className="h-10 w-full accent-[var(--accent)]"
          />
        </label>
      )}
    </div>
  );
}

function PeekGame({ done, say }: StepApi) {
  const NAME = useNames();
  const [a, setA] = useState<Color>(null);
  const [b, setB] = useState<Color>(null);
  const [guess, setGuess] = useState<Color>(null);
  const [rounds, setRounds] = useState(0);

  const shots = useShots(EXPLORER_CIRCUITS[4]); // H + CNOT Bell pair, run on Qiskit
  const [twinB, setTwinB] = useState<Color>(null);

  const peek = () => {
    const shot = shots.next(); // e.g. "00" or "11": right char = Twin A (q0), left = Twin B (q1)
    if (shot === null) return say(OFFLINE_MSG);
    const c: Color = shot[1] === "0" ? "a" : "b";
    setTwinB(shot[0] === "0" ? "a" : "b");
    setA(c);
    setB(null);
    setGuess(null);
    say(`Twin A turned ${NAME[c]}! Quick — what colour is Twin B, far away in another galaxy?`);
  };
  const predict = (g: "a" | "b") => {
    setGuess(g);
    setB(twinB);
    const r = rounds + 1;
    setRounds(r);
    say(g === twinB ? `Right! Twin B is ${NAME[twinB!]} too. They ALWAYS match — instantly! ✨` : `Twin B is ${NAME[twinB!]}! Entangled twins always match. Try again!`);
    if (r >= 3) done();
  };
  const reset = () => { setA(null); setB(null); setGuess(null); say("Back to mixed-up and linked. Peek again!"); };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full items-center justify-center">
        <Twin color={a} label="Twin A" shimmer={!a} />
        <Beam on gap={3} />
        <Twin color={b} label="Twin B 🌌" shimmer={!b && !a} />
      </div>
      {!a && <button className="btn-primary" onClick={peek}>👀 Peek at Twin A</button>}
      {a && !guess && (
        <div className="flex gap-3">
          {(["a", "b"] as const).map((c) => (
            <button key={c} className="btn" style={{ background: `var(--${c})`, color: "#1b2160" }} onClick={() => predict(c)}>
              Twin B is {NAME[c]}
            </button>
          ))}
        </div>
      )}
      {guess && <button className="btn-ghost" onClick={reset}>🔄 Entangle again</button>}
      <p className="text-lg text-muted">Matches checked: {rounds} / 3</p>
    </div>
  );
}

export default function Level4() {
  return (
    <LessonShell
      planetId={4}
      steps={[
        { say: "Meet the Twin Particles! Right now they're just two separate friends. Let's link them!", render: (a) => <MeetTwins {...a} /> },
        { say: "Both twins are mixed colours until someone peeks. Peek at Twin A!", render: (a) => <PeekGame {...a} /> },
      ]}
      quiz={[
        { q: "Entangled twins are…", options: [{ icon: "🔗", label: "Linked — they always match" }, { icon: "🎲", label: "Totally random strangers" }], answer: 0, why: "Entangled particles share a magic link." },
        { q: "Twin B is on Mars. Twin A turns orange. Twin B is…", options: [{ icon: "🧡", label: "Orange too!" }, { icon: "❓", label: "Impossible to know" }], answer: 0, why: "Distance doesn't matter — they match instantly." },
        { q: "Can you choose which colour Twin A will be?", options: [{ icon: "🙅", label: "No — it's random, but they match" }, { icon: "🎨", label: "Yes, any colour I like" }], answer: 0, why: "The colour is random, but the twins always agree." },
      ]}
    />
  );
}
