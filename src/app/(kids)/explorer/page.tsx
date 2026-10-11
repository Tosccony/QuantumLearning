"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar, { AVATAR_LABELS, AvatarSymbol, FACES, SUITS, TOPPERS } from "@/components/Avatar";
import { PLANET_ICON } from "@/components/KidsRail";
import Qubit from "@/components/Qubit";
import Dialog from "@/components/ui/Dialog";
import Icon, { type IconName } from "@/components/ui/Icon";
import { EdgeCode, Flag, Mark, Perf, Window } from "@/components/ui/primitives";
import { PLANETS, XP_PER_LEVEL, xpLevel, type Planet } from "@/lib/levels";
import { useProgress, type Settings } from "@/lib/progress";

const XP_CELLS = 10;

export default function Home() {
  const { state, ready, update } = useProgress();
  const [panel, setPanel] = useState<"avatar" | "settings" | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  const tapeRef = useRef<HTMLOListElement>(null);
  const nextKey = ready ? PLANETS.find((p) => !state.levels[p.id]?.completed)?.id : undefined;

  // Scroll the tape so the flagged (next) planet is in view, e.g. on phones.
  useEffect(() => {
    const el = tapeRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    const tape = tapeRef.current;
    if (!el || !tape) return;
    const left = el.offsetLeft - (tape.clientWidth - el.clientWidth) / 2;
    tape.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [nextKey, ready]);

  if (!ready) return null;

  if (!state.name) return <Welcome onStart={(name) => update((s) => ({ ...s, name }))} />;

  const done = (id: number) => !!state.levels[id]?.completed;
  const nextId = PLANETS.find((p) => !done(p.id))?.id;
  const lvl = xpLevel(state.xp);
  const into = state.xp % XP_PER_LEVEL;
  const filled = Math.floor((into / XP_PER_LEVEL) * XP_CELLS);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-5 sm:px-6">
      {/* HUD: a row of frames */}
      <header className="flex flex-wrap items-stretch gap-2" aria-label="Explorer status">
        <button type="button" onClick={() => setPanel("avatar")} className="frame flex min-h-11 items-center justify-center p-2 hover:border-ice" aria-label="Customise your avatar">
          <Avatar avatar={state.avatar} size={72} />
        </button>
        <div className="frame flex min-w-52 flex-1 flex-col justify-center gap-2 px-4 py-3">
          <h1 className="display text-2xl sm:text-3xl">Explorer {state.name}</h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 code text-sm text-fog">
            <span className="flex items-center gap-1.5"><Icon name="flag" size={14} className="text-ice" /><b className="display text-xl text-paper">{lvl}</b> <span className="label-sm">rank</span></span>
            <span className="flex items-center gap-1.5"><Icon name="xp" size={14} className="text-ice" /><b className="display text-xl text-paper">{state.xp}</b> <span className="label-sm">XP</span></span>
            <span className="flex items-center gap-1.5"><Icon name="streak" size={14} className="text-ice" /><b className="display text-xl text-paper">{state.streak}</b> <span className="label-sm">day streak</span></span>
            <span className="flex items-center gap-1.5"><Icon name="badge" size={14} className="text-ice" /><b className="display text-xl text-paper">{state.badges.length}/{PLANETS.length}</b> <span className="label-sm">badges</span></span>
          </p>
          <div className="flex items-center gap-2">
            <span className="label-sm opacity-80">To next rank</span>
            <div className="flex flex-1 gap-1" role="img" aria-label={`${into} of ${XP_PER_LEVEL} XP to next rank`}>
              {Array.from({ length: XP_CELLS }, (_, k) => (
                <span key={k} className={`h-2 w-full border border-[var(--line-strong)] ${k < filled ? "bg-ice" : ""}`} />
              ))}
            </div>
          </div>
        </div>
        <button type="button" className="keycap min-h-12 self-center !px-4" onClick={() => setPanel("settings")}>
          <Icon name="settings" size={20} />
          <span className="hidden sm:inline">Settings</span>
          <span className="sr-only sm:hidden">Settings</span>
        </button>
      </header>

      <Qubit
        text={
          nextId
            ? nextId === 1
              ? `Hi ${state.name}! I'm Qubit. Let's explore the Quantum Galaxy together! Tap the flagged planet to start. 🚀`
              : `Welcome back, ${state.name}! Next stop: ${PLANETS[nextId - 1].name}! 🪐`
            : `You've explored the WHOLE Quantum Galaxy, ${state.name}! You're a true Quantum Scientist! 🎓`
        }
      />

      {/* Mission tape: seven planet frames on one perforated strip */}
      <section aria-label="Mission tape: the seven planets" className="rail -mx-3 sm:mx-0">
        <Perf />
        <div className="relative">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 border-t border-dashed border-[var(--line)]" aria-hidden />
          <ol ref={tapeRef} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-4 pt-5 sm:px-4 lg:gap-2 [scrollbar-width:thin]">
            {PLANETS.map((p, k) => (
              <PlanetFrame key={p.id} planet={p} locked={k > 0 && !done(k)} isDone={done(p.id)} isNext={p.id === nextId} />
            ))}
          </ol>
        </div>
        <Perf />
      </section>

      {/* Badge collection */}
      <section aria-labelledby="badges-h" className="flex flex-col gap-3">
        <h2 id="badges-h" className="display text-2xl sm:text-3xl">Badge collection</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {PLANETS.map((p) => {
            const has = state.badges.includes(p.id);
            return (
              <li key={p.id} className={`frame flex min-h-28 flex-col items-center justify-center gap-2 p-3 text-center ${has ? "" : "frame-ghost"}`}>
                {has ? <Icon name={PLANET_ICON[p.id]} size={36} className="text-ice" title={`${p.badge} badge earned`} /> : <Icon name="lock" size={30} className="text-fog" title={`${p.badge} badge not earned yet`} />}
                <span className={`label ${has ? "text-paper" : "text-fog"}`}>{p.badge}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {panel === "avatar" && (
        <Dialog title="Customise your explorer" onClose={closePanel}>
          <AvatarEditor />
          <button type="button" className="keycap-xl keycap-paper-primary mt-5 w-full" onClick={closePanel}>
            Done
            <Icon name="check" size={20} />
          </button>
        </Dialog>
      )}
      {panel === "settings" && (
        <Dialog title="Settings" onClose={closePanel}>
          <SettingsPanel />
          <button type="button" className="keycap-xl keycap-paper-primary mt-5 w-full" onClick={closePanel}>
            Done
            <Icon name="check" size={20} />
          </button>
        </Dialog>
      )}
    </main>
  );
}

/** A drawn planet: a disc in the planet's colour with a thin ring. */
function PlanetDisc({ planet, locked, isDone, pulse }: { planet: Planet; locked: boolean; isDone: boolean; pulse: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="relative grid h-24 w-24 place-items-center"
      animate={pulse && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="47" fill="none" stroke={locked ? "var(--line)" : "var(--line-strong)"} strokeWidth="1.5" strokeDasharray={locked ? "4 4" : undefined} />
        <circle cx="50" cy="50" r="36" fill={locked ? "var(--navy-ink)" : planet.color} />
      </svg>
      {locked ? (
        <Icon name="lock" size={28} className="relative text-fog" />
      ) : isDone ? (
        <Icon name={PLANET_ICON[planet.id]} size={34} className="relative text-navy-ink" />
      ) : (
        <span className="code relative text-2xl font-bold text-navy-ink">{planet.id}</span>
      )}
    </motion.div>
  );
}

function PlanetFrame({ planet, locked, isDone, isNext }: { planet: Planet; locked: boolean; isDone: boolean; isNext: boolean }) {
  const label = `${planet.name}: ${planet.concept}${locked ? " (locked)" : isDone ? " (completed)" : isNext ? " (next)" : ""}`;
  const body = (
    <>
      {isNext && <Flag className="absolute -top-[11px] left-2" width={22} />}
      <div className="flex w-full items-center justify-between">
        <EdgeCode>P{String(planet.id).padStart(2, "0")}</EdgeCode>
        {locked ? <Mark kind="locked" size={18} /> : isDone ? <Mark kind="done" size={18} /> : isNext ? <span className="label-sm text-ice">Next</span> : null}
      </div>
      <PlanetDisc planet={planet} locked={locked} isDone={isDone} pulse={isNext} />
      <div className="flex flex-col items-center gap-1 text-center">
        <span className={`display text-xl leading-none ${locked ? "text-fog" : ""}`}>{planet.name}</span>
        <span className="label text-fog">{planet.concept}</span>
      </div>
    </>
  );
  const cls = `frame flex h-full min-h-56 w-44 shrink-0 snap-start lg:w-[8.4rem] xl:w-[8.8rem] flex-col items-center justify-between gap-3 p-3 ${isNext ? "frame-active" : ""} ${locked ? "punched" : "hover:border-ice"}`;
  return (
    <li className="flex shrink-0">
      {locked ? (
        <div className={cls} aria-disabled="true" role="group" aria-label={label}>{body}</div>
      ) : (
        <Link href={`/planet/${planet.id}`} className={cls} aria-label={label} aria-current={isNext ? "step" : undefined}>
          {body}
        </Link>
      )}
    </li>
  );
}

function Welcome({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-xl flex-col justify-center gap-6 px-4 py-8">
      <motion.h1 initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="display text-center text-5xl sm:text-6xl">
        Quantum Quest
      </motion.h1>
      <Qubit text="Beep boop! I'm Qubit the Robot. Our mission: travel the Quantum Galaxy and unlock mysterious quantum powers! What's your explorer name?" />
      <Window as="form" className="flex flex-col gap-4 p-5 sm:p-6" onSubmit={(e: React.FormEvent) => { e.preventDefault(); if (name.trim()) onStart(name.trim().slice(0, 20)); }}>
        <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
        <h2 className="display text-2xl">Sign the mission log</h2>
        <label htmlFor="name" className="text-lg">Explorer name (just your first name or a nickname!)</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          maxLength={20}
          className="field !min-h-14 !text-2xl"
          placeholder="Star Captain"
        />
        <button className="keycap-xl keycap-paper-primary" disabled={!name.trim()}>
          Blast off
          <Icon name="rocket" size={22} />
        </button>
      </Window>
    </main>
  );
}

function AvatarEditor() {
  const { state, update } = useProgress();
  const set = (k: "suit" | "topper" | "face", v: string) => update((s) => ({ ...s, avatar: { ...s.avatar, [k]: v } }));
  const row = (title: string, k: "suit" | "topper" | "face", opts: string[]) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="label mb-2 text-[#46587a]">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = state.avatar[k] === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => set(k, o)}
              aria-pressed={on}
              className={`relative flex h-14 w-14 items-center justify-center border-2 text-3xl leading-none ${on ? "border-navy-ink" : "border-paper-3 hover:border-navy-ink"}`}
              style={{ background: k === "suit" ? o : "var(--paper-2)" }}
              aria-label={k === "suit" ? `Suit colour ${o}` : AVATAR_LABELS[o]}
            >
              {k !== "suit" && <AvatarSymbol value={o} />}
              {on && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center bg-navy-ink" aria-hidden>
                  <Icon name="check" size={12} className="text-ice" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar avatar={state.avatar} size={96} />
        <p className="text-[#46587a]">Pick a suit, a face and a helmet topper.</p>
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
  const items: { k: keyof Settings; icon: IconName; label: string; hint: string }[] = [
    { k: "narration", icon: "sound", label: "Voice narration", hint: "Qubit reads everything out loud" },
    { k: "colorblind", icon: "eye", label: "Colour-blind friendly", hint: "Uses blue and orange instead of pink and green" },
    { k: "bigText", icon: "plus", label: "Bigger text", hint: "Makes all words larger" },
  ];
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => {
        const on = state.settings[it.k];
        return (
          <button
            key={it.k}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => toggle(it.k)}
            className="flex min-h-16 items-center gap-4 border border-paper-3 bg-paper-2 p-4 text-left hover:border-navy-ink"
          >
            <Icon name={it.icon} size={26} className="shrink-0 text-navy-ink" />
            <span className="flex-1">
              <b className="block text-lg">{it.label}</b>
              <span className="text-sm text-[#46587a]">{it.hint}</span>
            </span>
            <span className="label-sm w-7 text-right text-[#46587a]" aria-hidden>{on ? "On" : "Off"}</span>
            <span className="relative h-8 w-14 shrink-0 border border-navy-ink bg-paper" aria-hidden>
              <span
                className={`absolute top-[3px] h-6 w-6 border border-navy-ink transition-[left] duration-150 ${on ? "left-[29px] bg-navy-ink" : "left-[3px] bg-paper"}`}
              />
            </span>
          </button>
        );
      })}
      <p className="text-sm text-[#46587a]">Captions are always on — everything Qubit says appears in the speech bubble.</p>
    </div>
  );
}
