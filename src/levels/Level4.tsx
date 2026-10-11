"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";
import Icon from "@/components/ui/Icon";
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
        animate={shimmer ? { background: ["var(--a)", "var(--b)", "var(--a)"], scale: [1, 1.04, 1] } : { background: color ? `var(--${color})` : "var(--off)", scale: 1 }}
        transition={shimmer ? { duration: 1.6, repeat: Infinity } : { type: "spring", stiffness: 160, damping: 18 }}
        className="flex h-24 w-24 items-center justify-center border-[3px] border-navy-ink text-5xl leading-none sm:h-28 sm:w-28"
        role="img"
        aria-label={`${label}: ${shimmer ? "mixed, not decided yet" : color ? NAME[color] : "unknown"}`}
      >
        {shimmer ? "😊" : color ? "😄" : "😶"}
      </motion.div>
      <span className="label text-navy-ink">{label}</span>
    </div>
  );
}

/** The quantum bond: a two-tone bar in the twins' colours that pulses while linked. */
function Beam({ on, gap }: { on: boolean; gap: number }) {
  return (
    <div className="relative h-4 flex-1" style={{ minWidth: 40 + gap * 30 }}>
      {on && (
        <motion.div className="absolute inset-y-1 left-0 right-0 flex" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} aria-hidden>
          <span className="h-full w-1/2" style={{ background: "var(--a)" }} />
          <span className="h-full w-1/2" style={{ background: "var(--b)" }} />
        </motion.div>
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
        <button type="button" className="keycap-xl keycap-paper-primary" onClick={() => { setLinked(true); say("Zap! ⚡ They're ENTANGLED now — linked by a magic quantum bond. Slide them far apart!"); }}>
          <Icon name="twins" size={22} />
          Entangle the twins
        </button>
      ) : (
        <label className="flex w-full max-w-md flex-col gap-2 text-lg">
          <span>Move Twin B to: <b>{PLACES[dist]}</b></span>
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
            className="scrub w-full"
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
      {!a && (
        <button type="button" className="keycap-xl keycap-paper-primary" onClick={peek}>
          <Icon name="eye" size={22} />
          Peek at Twin A
        </button>
      )}
      {a && !guess && (
        <div className="flex flex-wrap justify-center gap-3">
          {(["a", "b"] as const).map((c) => (
            <button
              key={c}
              type="button"
              className="keycap keycap-xl"
              style={{ background: `var(--${c})`, borderColor: "var(--navy-ink)", color: "var(--navy-ink)" }}
              onClick={() => predict(c)}
            >
              Twin B is {NAME[c]}
            </button>
          ))}
        </div>
      )}
      {guess && (
        <button type="button" className="keycap-xl keycap-paper" onClick={reset}>
          <Icon name="reset" size={20} />
          Entangle again
        </button>
      )}
      <p className="text-lg text-[#46587a]">Matches checked: <span className="code text-navy-ink">{rounds} / 3</span></p>
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
