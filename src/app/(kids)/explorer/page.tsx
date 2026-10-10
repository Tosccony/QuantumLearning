"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import Avatar, { FACES, SUITS, TOPPERS } from "@/components/Avatar";
import Qubit from "@/components/Qubit";
import { PLANETS, XP_PER_LEVEL, xpLevel } from "@/lib/levels";
import { useProgress, type Settings } from "@/lib/progress";

// Winding path positions (percent of map) for the 7 planets.
const PATH = [
  { x: 12, y: 80 }, { x: 30, y: 55 }, { x: 18, y: 25 }, { x: 45, y: 12 },
  { x: 62, y: 40 }, { x: 80, y: 18 }, { x: 86, y: 68 },
];

export default function Home() {
  const { state, ready, update } = useProgress();
  const [panel, setPanel] = useState<"avatar" | "settings" | null>(null);
  if (!ready) return null;

  if (!state.name) return <Welcome onStart={(name) => update((s) => ({ ...s, name }))} />;

  const done = (id: number) => !!state.levels[id]?.completed;
  const nextId = PLANETS.find((p) => !done(p.id))?.id;
  const lvl = xpLevel(state.xp);
  const into = state.xp % XP_PER_LEVEL;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6">
      {/* HUD */}
      <header className="card flex flex-wrap items-center gap-4">
        <button onClick={() => setPanel("avatar")} aria-label="Customise your avatar"><Avatar avatar={state.avatar} /></button>
        <div className="min-w-40 flex-1">
          <p className="text-2xl font-bold">Explorer {state.name}</p>
          <p className="text-muted">Rank {lvl} · {state.xp} XP</p>
          <div className="mt-1 h-3 w-full max-w-64 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={into} aria-valuemax={XP_PER_LEVEL} aria-label="XP to next rank">
            <motion.div className="h-full bg-on" initial={{ width: 0 }} animate={{ width: `${into}%` }} />
          </div>
        </div>
        <Stat icon="🔥" value={state.streak} label="day streak" />
        <Stat icon="🏅" value={state.badges.length} label="badges" />
        <div className="flex gap-2">
          <button className="btn-ghost !min-h-12 !px-4 !py-2" onClick={() => setPanel("settings")} aria-label="Settings">⚙️</button>
          <Link className="btn-ghost !min-h-12 !px-4 !py-2 !text-base" href="/grownups">👪 Grown-ups</Link>
          <Link className="btn-ghost !min-h-12 !px-4 !py-2 !text-base" href="/" title="All tracks, the Lab and the community">⚛ All tracks</Link>
        </div>
      </header>

      <Qubit
        text={
          nextId
            ? nextId === 1
              ? `Hi ${state.name}! I'm Qubit. Let's explore the Quantum Galaxy together! Tap the glowing planet to start. 🚀`
              : `Welcome back, ${state.name}! Next stop: ${PLANETS[nextId - 1].name}! 🪐`
            : `You've explored the WHOLE Quantum Galaxy, ${state.name}! You're a true Quantum Scientist! 🎓`
        }
      />

      {/* Galaxy progress map */}
      <section aria-label="Quantum Galaxy map" className="card relative aspect-[4/5] w-full overflow-hidden !p-0 sm:aspect-[16/10]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={PATH.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#ffffff40" strokeWidth="0.6" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {PLANETS.map((p, k) => {
          const locked = k > 0 && !done(k);
          const isNext = p.id === nextId;
          return (
            <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${PATH[k].x}%`, top: `${PATH[k].y}%` }}>
              <Link
                href={locked ? "#" : `/planet/${p.id}`}
                aria-disabled={locked}
                onClick={(e) => locked && e.preventDefault()}
                className={`group flex flex-col items-center gap-1 ${locked ? "cursor-not-allowed" : ""}`}
                aria-label={`${p.name}: ${p.concept}${locked ? " (locked)" : done(p.id) ? " (completed)" : ""}`}
              >
                <motion.span
                  animate={isNext ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full text-3xl sm:h-20 sm:w-20 sm:text-4xl"
                  style={{
                    background: locked ? "#3a4180" : `radial-gradient(circle at 30% 30%, #fff8, ${p.color} 45%, #0005)`,
                    boxShadow: isNext ? `0 0 30px 8px ${p.color}` : "none",
                  }}
                >
                  {locked ? "🔒" : done(p.id) ? p.badgeIcon : p.id}
                  {done(p.id) && <span className="absolute -right-1 -top-1 text-xl">✅</span>}
                </motion.span>
                <span className="rounded-full bg-space/80 px-2 py-0.5 text-center text-xs font-semibold sm:text-sm">{p.concept}</span>
              </Link>
            </div>
          );
        })}
      </section>

      {/* Achievement collection */}
      <section className="card">
        <h2 className="mb-3 text-2xl font-bold">🏆 Badge collection</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {PLANETS.map((p) => {
            const has = state.badges.includes(p.id);
            return (
              <div key={p.id} className={`flex flex-col items-center gap-1 rounded-2xl bg-space-2 p-3 text-center ${has ? "" : "opacity-40 grayscale"}`}>
                <span className="text-4xl" aria-hidden>{has ? p.badgeIcon : "❔"}</span>
                <span className="text-sm font-semibold">{p.badge}</span>
              </div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {panel && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
          >
            <motion.div
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              className="card w-full max-w-lg !bg-panel"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal
            >
              {panel === "avatar" ? <AvatarEditor /> : <SettingsPanel />}
              <button className="btn-primary mt-5 w-full" onClick={() => setPanel(null)}>Done ✓</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-space-2 px-4 py-2">
      <span className="text-3xl" aria-hidden>{icon}</span>
      <div><b className="text-2xl">{value}</b> <span className="text-sm text-muted">{label}</span></div>
    </div>
  );
}

function Welcome({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-6">
      <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center text-5xl font-bold text-on sm:text-6xl">
        Quantum Quest
      </motion.h1>
      <Qubit text="Beep boop! I'm Qubit the Robot. Our mission: travel the Quantum Galaxy and unlock mysterious quantum powers! What's your explorer name?" />
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onStart(name.trim().slice(0, 20)); }}>
        <label htmlFor="name" className="text-xl">Explorer name (just your first name or a nickname!)</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          maxLength={20}
          className="rounded-2xl bg-white px-5 py-4 text-2xl text-[#1b2160] outline-none focus:ring-4 focus:ring-on"
          placeholder="Star Captain"
        />
        <button className="btn-primary" disabled={!name.trim()}>Blast off! 🚀</button>
      </form>
    </main>
  );
}

function AvatarEditor() {
  const { state, update } = useProgress();
  const set = (k: "suit" | "topper" | "face", v: string) => update((s) => ({ ...s, avatar: { ...s.avatar, [k]: v } }));
  const row = (title: string, k: "suit" | "topper" | "face", opts: string[]) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-lg font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => set(k, o)}
            aria-pressed={state.avatar[k] === o}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${state.avatar[k] === o ? "ring-4 ring-on" : ""}`}
            style={{ background: k === "suit" ? o : "var(--space-2)" }}
            aria-label={k === "suit" ? `Suit colour ${o}` : o}
          >
            {k !== "suit" && o}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar avatar={state.avatar} size={96} />
        <h2 className="text-2xl font-bold">Customise your explorer</h2>
      </div>
      {row("Space suit", "suit", SUITS)}
      {row("Face", "face", FACES)}
      {row("Helmet topper", "topper", TOPPERS)}
    </div>
  );
}

function SettingsPanel() {
  const { state, update } = useProgress();
  const toggle = (k: keyof Settings) => update((s) => ({ ...s, settings: { ...s.settings, [k]: !s.settings[k] } }));
  const items: { k: keyof Settings; icon: string; label: string; hint: string }[] = [
    { k: "narration", icon: "🔊", label: "Voice narration", hint: "Qubit reads everything out loud" },
    { k: "colorblind", icon: "🎨", label: "Colour-blind friendly", hint: "Uses blue and orange instead of pink and green" },
    { k: "bigText", icon: "🔠", label: "Bigger text", hint: "Makes all words larger" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">⚙️ Settings</h2>
      {items.map((it) => (
        <button key={it.k} role="switch" aria-checked={state.settings[it.k]} onClick={() => toggle(it.k)} className="flex items-center gap-4 rounded-2xl bg-space-2 p-4 text-left">
          <span className="text-3xl" aria-hidden>{it.icon}</span>
          <span className="flex-1">
            <b className="block text-lg">{it.label}</b>
            <span className="text-sm text-muted">{it.hint}</span>
          </span>
          <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${state.settings[it.k] ? "justify-end bg-good" : "justify-start bg-white/20"}`}>
            <span className="h-6 w-6 rounded-full bg-white" />
          </span>
        </button>
      ))}
      <p className="text-sm text-muted">Captions are always on — everything Qubit says appears in the speech bubble.</p>
    </div>
  );
}
