"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LessonShell, { type StepApi } from "@/components/LessonShell";

function LightSwitch({ done, say }: StepApi) {
  const [on, setOn] = useState(false);
  const [flips, setFlips] = useState(0);
  const flip = () => {
    const v = !on;
    setOn(v);
    const f = flips + 1;
    setFlips(f);
    say(v ? "ON! The computer writes that as 1. ✨" : "OFF! The computer writes that as 0. 🌙");
    if (f >= 3) done();
  };
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
      <motion.div
        animate={{ boxShadow: on ? "0 0 90px 30px var(--on)" : "0 0 0 0 transparent", background: on ? "var(--on)" : "var(--off)" }}
        className="flex h-36 w-36 items-center justify-center rounded-full text-7xl"
        aria-hidden
      >
        💡
      </motion.div>
      <button
        onClick={flip}
        role="switch"
        aria-checked={on}
        aria-label="Light switch"
        className={`flex h-44 w-24 flex-col rounded-3xl bg-[#dfe5ff] p-3 shadow-inner ${on ? "justify-start" : "justify-end"}`}
      >
        <motion.span
          layout
          className="block h-1/2 w-full rounded-2xl shadow-lg"
          style={{ background: on ? "var(--on)" : "var(--off)" }}
        />
      </button>
      <motion.div key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="text-9xl font-bold tabular-nums" style={{ color: on ? "var(--on)" : "var(--muted)" }}>
        {on ? 1 : 0}
      </motion.div>
    </div>
  );
}

const ITEMS = [
  { icon: "🔦", label: "Torch shining", on: true },
  { icon: "😴", label: "Robot sleeping", on: false },
  { icon: "📺", label: "TV playing cartoons", on: true },
  { icon: "🌑", label: "Lamp unplugged", on: false },
  { icon: "🚦", label: "Traffic light glowing", on: true },
  { icon: "🔇", label: "Speaker muted", on: false },
];

function SortGame({ done, say }: StepApi) {
  const [left, setLeft] = useState(ITEMS);
  const [held, setHeld] = useState<number | null>(null);
  const [buckets, setBuckets] = useState<{ on: string[]; off: string[] }>({ on: [], off: [] });

  const drop = (bucket: "on" | "off") => {
    if (held === null) return say("First tap an object, then tap a bucket! 👆");
    const item = left[held];
    if (item.on !== (bucket === "on")) {
      setHeld(null);
      return say(`Hmm, is "${item.label}" really ${bucket.toUpperCase()}? Try again!`);
    }
    const rest = left.filter((_, k) => k !== held);
    setLeft(rest);
    setHeld(null);
    setBuckets((b) => ({ ...b, [bucket]: [...b[bucket], item.icon] }));
    if (rest.length === 0) {
      say("All sorted! Every object is either ON (1) or OFF (0). That's a bit! 🎉");
      done();
    } else say(bucket === "on" ? "Yes! That's ON — a 1! ⭐" : "Yes! That's OFF — a 0! ⭐");
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {left.map((it, k) => (
          <motion.button
            layout
            key={it.label}
            onClick={() => setHeld(k)}
            className={`flex min-h-20 items-center gap-3 rounded-2xl bg-space-2 p-3 text-left text-lg ${held === k ? "ring-4 ring-on" : ""}`}
          >
            <span className="text-4xl" aria-hidden>{it.icon}</span> {it.label}
          </motion.button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(["on", "off"] as const).map((b) => (
          <button
            key={b}
            onClick={() => drop(b)}
            className="flex min-h-36 flex-col items-center justify-start gap-2 rounded-3xl border-4 border-dashed p-3"
            style={{ borderColor: b === "on" ? "var(--on)" : "var(--muted)", background: b === "on" ? "color-mix(in srgb, var(--on) 15%, transparent)" : "transparent" }}
          >
            <span className="text-2xl font-bold">{b === "on" ? "ON = 1 ☀️" : "OFF = 0 🌙"}</span>
            <span className="text-3xl">{buckets[b].join(" ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const SECRET = [1, 0, 1, 1];

function SecretCode({ done, say }: StepApi) {
  const [bits, setBits] = useState([0, 0, 0, 0]);
  const [won, setWon] = useState(false);
  const toggle = (k: number) => {
    if (won) return;
    const nb = bits.map((b, j) => (j === k ? 1 - b : b));
    setBits(nb);
    if (nb.every((b, j) => b === SECRET[j])) {
      setWon(true);
      say("The door opens! 4 bits made a secret code. Computers use billions of bits to store pictures, games and music! 🚪✨");
      done();
    }
  };
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-xl">Match the secret code on the space door:</p>
      <div className="flex gap-3 rounded-2xl bg-space-2 px-6 py-3 text-5xl font-bold tracking-widest text-on">{SECRET.join(" ")}</div>
      <div className="flex gap-3">
        {bits.map((b, k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggle(k)}
            aria-label={`Switch ${k + 1}: ${b ? "on" : "off"}`}
            className="flex h-24 w-16 flex-col items-center justify-center rounded-2xl text-3xl font-bold sm:h-28 sm:w-20"
            style={{ background: b ? "var(--on)" : "var(--off)", color: b ? "#1b2160" : "var(--ink)" }}
          >
            {b}
            <span className="text-sm">{b ? "ON" : "OFF"}</span>
          </motion.button>
        ))}
      </div>
      <motion.div animate={{ rotateY: won ? 80 : 0 }} style={{ transformOrigin: "left" }} className="text-7xl" aria-hidden>
        🚪
      </motion.div>
    </div>
  );
}

export default function Level1() {
  return (
    <LessonShell
      planetId={1}
      steps={[
        { say: "Welcome to Bitopia, explorer! Computers think with tiny switches. Flip this one a few times! 👇", render: (a) => <LightSwitch {...a} /> },
        { say: "A bit is just ON or OFF. Tap an object, then tap the bucket where it belongs!", render: (a) => <SortGame {...a} /> },
        { say: "Put bits together and you can make codes! Can you open the space door?", render: (a) => <SecretCode {...a} /> },
      ]}
      quiz={[
        { q: "A bit can be…", options: [{ icon: "🔀", label: "0 or 1" }, { icon: "🌈", label: "Any colour" }, { icon: "🔢", label: "Any number" }], answer: 0, why: "A bit is always 0 (OFF) or 1 (ON)." },
        { q: "A light that is ON is like…", options: [{ icon: "0️⃣", label: "the bit 0" }, { icon: "1️⃣", label: "the bit 1" }], answer: 1, why: "ON = 1 and OFF = 0." },
        { q: "How do computers store a whole game?", options: [{ icon: "🧩", label: "Lots and lots of bits" }, { icon: "🪄", label: "Magic dust" }, { icon: "📦", label: "One giant bit" }], answer: 0, why: "Billions of tiny bits work together!" },
      ]}
    />
  );
}
