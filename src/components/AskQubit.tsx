"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speak";
import { QubitBot } from "./Qubit";

/**
 * Offline, child-safe tutor: answers come only from this vetted list, matched by keywords.
 * Swap `answer()` for a call to a moderated LLM endpoint to make it a full AI tutor.
 */
const KB: { keys: string[]; a: string }[] = [
  { keys: ["bit", "switch", "binary"], a: "A bit is the tiniest piece of computer information. It's like a light switch: OFF is 0 and ON is 1. Computers use billions of bits to store games, pictures and music! 💡" },
  { keys: ["qubit", "quantum bit", "coin"], a: "A qubit is a quantum bit. A normal bit is heads OR tails, but a qubit is like a spinning coin — a mix of both until you look at it! 🪙" },
  { keys: ["superposition", "both", "many places", "cloud"], a: "Superposition means a qubit can be in many possibilities at the same time — like a treasure that's in lots of places until you look. Then it pops into just one spot! 🗺️" },
  { keys: ["entangle", "twin", "link", "match"], a: "Entanglement links two qubits like magical twins. Even if one is in another galaxy, when you peek at one, the other always matches — instantly! 👯" },
  { keys: ["gate", "x gate", "h gate", "z gate", "circuit"], a: "Gates are little machines that change qubits. X flips 0 and 1. H makes a superposition. Z twists the ‘both’ state. Put gates in a row and you've made a quantum program! ⚙️" },
  { keys: ["algorithm", "faster", "fast", "search", "door"], a: "An algorithm is a recipe for solving a problem. Some quantum algorithms make the right answer glow brighter and brighter, so they find it with fewer peeks — but only for special kinds of problems! 🧙" },
  { keys: ["cold", "fridge", "chandelier", "temperature"], a: "Many quantum computers are kept colder than outer space! Heat makes atoms wiggle, and wiggles make qubits forget their quantum magic. 🥶" },
  { keys: ["real", "ibm", "google", "microsoft", "exist", "build"], a: "Yes, they're real! IBM, Google, Microsoft and lots of universities are building quantum computers today. They're still small and tricky, so scientists are working hard to make them bigger and better. 🔬" },
  { keys: ["measure", "look", "observe", "peek"], a: "When you look at (measure) a qubit, it has to choose: 0 or 1. Looking pops the superposition bubble! 👀" },
  { keys: ["what can", "use", "why", "help", "future"], a: "Scientists hope quantum computers will help invent new medicines, design better batteries and understand nature in new ways. Maybe you'll discover something! 🌟" },
  { keys: ["who are you", "your name", "robot", "qubit the"], a: "I'm Qubit the Robot, your guide through the Quantum Galaxy! Beep boop! 🤖" },
  { keys: ["hello"], a: "Hi explorer! Ask me anything about bits, qubits, superposition or entanglement! 👋" },
];

function answer(q: string) {
  const t = q.toLowerCase();
  let best = { score: 0, a: "" };
  for (const k of KB) {
    const score = k.keys.reduce((n, key) => n + (t.includes(key) ? key.length : 0), 0);
    if (score > best.score) best = { score, a: k.a };
  }
  return best.a || "Ooh, good question! I'm not sure about that one. Try asking about bits, qubits, superposition, entanglement, gates or real quantum computers! 🤔";
}

const STARTERS = ["What is a qubit?", "What is entanglement?", "Why are they so cold?", "Are quantum computers real?"];

type Msg = { from: "me" | "qubit"; text: string };

export default function AskQubit() {
  const { state } = useProgress();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "qubit", text: "Hi! I'm Qubit. Ask me any quantum question! 🤖" }]);
  const end = useRef<HTMLDivElement>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  if (path.startsWith("/grownups")) return null;

  const ask = (q: string) => {
    if (!q.trim()) return;
    const a = answer(q);
    setMsgs((m) => [...m, { from: "me", text: q.trim() }, { from: "qubit", text: a }]);
    setInput("");
    if (state.settings.narration) speak(a);
  };

  // Voice questions use the browser's speech recognition when available.
  type Rec = { lang: string; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void; start: () => void };
  const W = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }) : undefined;
  const SR = W?.SpeechRecognition ?? W?.webkitSpeechRecognition;
  const listen = () => {
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 text-lg font-semibold text-[#1b2160] shadow-2xl print:hidden"
        aria-expanded={open}
        aria-label="Ask Qubit a question"
      >
        <span className="rounded-full bg-[#1b2160]"><QubitBot size={48} /></span>
        {open ? "Close" : "Ask Qubit"}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50 flex h-[min(520px,70dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white text-[#1b2160] shadow-2xl"
            role="dialog"
            aria-label="Chat with Qubit"
          >
            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {msgs.map((m, k) => (
                <div key={k} className={`max-w-[85%] rounded-2xl px-4 py-2 text-lg ${m.from === "me" ? "ml-auto bg-accent text-white" : "bg-[#eef0ff]"}`}>
                  {m.text}
                </div>
              ))}
              {msgs.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-full border-2 border-accent px-3 py-1 text-base text-accent">{s}</button>
                  ))}
                </div>
              )}
              <div ref={end} />
            </div>
            <form className="flex gap-2 border-t border-[#e0e4ff] p-3" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a question…"
                maxLength={200}
                className="min-w-0 flex-1 rounded-2xl bg-[#eef0ff] px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-accent"
                aria-label="Your question"
              />
              {SR && (
                <button type="button" onClick={listen} className={`rounded-2xl px-3 text-2xl ${listening ? "bg-bad" : "bg-[#eef0ff]"}`} aria-label="Ask with your voice">
                  🎤
                </button>
              )}
              <button className="rounded-2xl bg-accent px-4 text-xl text-white" aria-label="Send">➤</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
