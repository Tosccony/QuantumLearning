"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLANETS } from "@/lib/levels";
import { today, useProgress, type State } from "@/lib/progress";

const ACTIVITIES: Record<number, string> = {
  1: "Play “light switch Morse”: flash a torch ON/OFF to send a 4-bit secret code across the room.",
  2: "Spin a real coin on the table and ask: is it heads or tails while it's spinning?",
  3: "Hide a toy under one of three cups and talk about ‘where it might be’ before lifting a cup.",
  4: "Put matching socks in two bags, send one bag to another room — opening one tells you the other!",
  5: "Make paper gate cards (X, H, Z) and ‘run’ a stuffed-toy qubit through them on the floor.",
  6: "Race: one person checks every page of a book for a sticker, the other uses the index. Which is faster?",
  7: "Watch a short video of a real quantum computer ‘chandelier’ together and spot the cold plates.",
};

function mastery(s: State, id: number) {
  const l = s.levels[id];
  if (!l?.completed) return { label: "Not started", tone: "text-muted" };
  return l.quizCorrect / l.quizTotal >= 2 / 3 ? { label: "Mastered", tone: "text-good" } : { label: "Developing", tone: "text-on" };
}

const fmtMin = (sec: number) => `${Math.max(1, Math.round(sec / 60))} min`;

export default function GrownUps() {
  const { state, ready, reset } = useProgress();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<"parent" | "teacher">("parent");
  const [gate] = useState(() => ({ a: 6 + Math.floor(Math.random() * 4), b: 6 + Math.floor(Math.random() * 4) }));
  const [answer, setAnswer] = useState("");

  if (!ready) return null;

  if (!unlocked)
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
        <h1 className="text-3xl font-bold">👪 Grown-ups only</h1>
        <form className="card flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (+answer === gate.a * gate.b) setUnlocked(true); }}>
          <label htmlFor="gate" className="text-lg">To continue, what is {gate.a} × {gate.b}?</label>
          <input id="gate" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} className="rounded-xl bg-white px-4 py-3 text-xl text-[#1b2160]" />
          <button className="btn-primary">Enter</button>
        </form>
        <Link href="/explorer" className="text-center text-muted underline">← Back to the galaxy</Link>
      </main>
    );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 print:text-black">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/explorer" className="btn-ghost !min-h-12 !px-4 !py-2 !text-lg">← Galaxy</Link>
        <h1 className="flex-1 text-3xl font-bold">Dashboard · {state.name || "Explorer"}</h1>
        <div className="flex rounded-2xl bg-space-2 p-1" role="tablist">
          {(["parent", "teacher"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-xl px-5 py-2 text-lg capitalize ${tab === t ? "bg-accent" : ""}`}>
              {t}
            </button>
          ))}
        </div>
      </header>
      {tab === "parent" ? <ParentView s={state} /> : <TeacherView s={state} />}
      <button
        className="self-start text-sm text-muted underline print:hidden"
        onClick={() => { if (confirm("Erase all progress on this device? This can't be undone.")) reset(); }}
      >
        Reset all progress on this device
      </button>
    </main>
  );
}

function ParentView({ s }: { s: State }) {
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => {
        const d = new Date(Date.now() - (6 - k) * 864e5);
        const key = today(d);
        return { key, day: d.toLocaleDateString(undefined, { weekday: "short" }), xp: s.activity[key] ?? 0, min: s.minutes[key] ?? 0 };
      }),
    [s],
  );
  const max = Math.max(50, ...week.map((w) => w.xp));
  const weekMin = Math.round(week.reduce((a, w) => a + w.min, 0));
  const done = PLANETS.filter((p) => s.levels[p.id]?.completed);
  const developing = done.filter((p) => mastery(s, p.id).label === "Developing");
  const next = PLANETS.find((p) => !s.levels[p.id]?.completed);

  const insights = [
    done.length === 0 ? "Your explorer hasn't finished a planet yet — the first one takes about 4 minutes." : `Finished ${done.length} of 7 planets.`,
    s.streak > 1 ? `🔥 On a ${s.streak}-day streak — short daily sessions help ideas stick.` : "Try a 5-minute session each day to build a streak.",
    developing.length ? `Worth revisiting together: ${developing.map((p) => p.concept).join(", ")} (quiz under 2/3).` : done.length ? "Every finished planet has a strong quiz score. 🌟" : "",
    done.some((p) => p.id === 4) ? "Ask: “Can you explain entanglement using two socks?” Explaining in their own words is the goal." : "",
  ].filter(Boolean);

  const suggestions = [...developing.map((p) => p.id), ...done.map((p) => p.id).reverse()].slice(0, 2);
  if (next && suggestions.length < 2) suggestions.push(next.id);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="card md:col-span-2">
        <h2 className="mb-1 text-2xl font-bold">This week</h2>
        <p className="mb-4 text-muted">{weekMin} minutes played · {week.reduce((a, w) => a + w.xp, 0)} XP earned</p>
        <div className="flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="XP earned each day this week">
          {week.map((w) => (
            <div key={w.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-sm tabular-nums text-muted">{w.xp || ""}</span>
              <div className="w-full max-w-12 rounded-t-lg bg-accent" style={{ height: `${(w.xp / max) * 120}px`, minHeight: 4 }} />
              <span className="text-sm">{w.day}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="mb-3 text-2xl font-bold">💡 Learning insights</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-lg">{insights.map((i) => <li key={i}>{i}</li>)}</ul>
      </section>
      <section className="card">
        <h2 className="mb-3 text-2xl font-bold">🏡 Try together offline</h2>
        <ul className="flex flex-col gap-3 text-lg">
          {suggestions.map((id) => (
            <li key={id}><b>{PLANETS[id - 1].concept}:</b> {ACTIVITIES[id]}</li>
          ))}
        </ul>
      </section>
      <section className="card md:col-span-2">
        <h2 className="mb-3 text-2xl font-bold">🎉 Milestones</h2>
        {done.length === 0 ? (
          <p className="text-muted">Milestones appear here as badges are earned.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {done.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-space-2 p-3">
                <span className="text-3xl" aria-hidden>{p.badgeIcon}</span>
                <span className="flex-1">{p.badge} badge</span>
                <span className="text-sm text-muted">{new Date(s.levels[p.id].completedAt!).toLocaleDateString()}</span>
              </li>
            ))}
            {s.badges.length === 7 && <li className="rounded-2xl bg-on p-3 font-bold text-[#1b2160]">🎓 Completed the whole Quantum Galaxy!</li>}
          </ul>
        )}
      </section>
    </div>
  );
}

function TeacherView({ s }: { s: State }) {
  const rows = PLANETS.map((p) => {
    const l = s.levels[p.id];
    return {
      planet: `${p.id}. ${p.concept}`,
      status: l?.completed ? "Completed" : "Not started",
      quiz: l ? `${l.quizCorrect}/${l.quizTotal}` : "—",
      time: l ? fmtMin(l.timeSec) : "—",
      attempts: l?.attempts ?? 0,
      mastery: mastery(s, p.id),
    };
  });
  const totalQuiz = PLANETS.reduce((a, p) => a + (s.levels[p.id]?.quizCorrect ?? 0), 0);
  const totalQs = PLANETS.reduce((a, p) => a + (s.levels[p.id]?.quizTotal ?? 0), 0);

  const download = () => {
    const header = ["Learner", "Planet", "Status", "Quiz", "Time", "Attempts", "Mastery"];
    const lines = rows.map((r) => [s.name, r.planet, r.status, r.quiz, r.time, r.attempts, r.mastery.label]);
    const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `quantum-quest-${s.name || "learner"}-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-bold">Progress report</h2>
        <button className="btn-ghost !min-h-12 !py-2 !text-base print:hidden" onClick={download}>⬇️ Download CSV</button>
        <button className="btn-ghost !min-h-12 !py-2 !text-base print:hidden" onClick={() => window.print()}>🖨️ Print / PDF</button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Kpi label="Lessons completed" value={`${s.badges.length}/7`} />
        <Kpi label="Quiz accuracy" value={totalQs ? `${Math.round((totalQuiz / totalQs) * 100)}%` : "—"} />
        <Kpi label="Time in lessons" value={fmtMin(Object.values(s.levels).reduce((a, l) => a + l.timeSec, 0))} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-lg">
          <thead className="text-muted">
            <tr>{["Planet", "Status", "Quiz", "Time", "Attempts", "Mastery"].map((h) => <th key={h} className="p-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.planet} className="border-t border-white/10">
                <td className="p-2">{r.planet}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2 tabular-nums">{r.quiz}</td>
                <td className="p-2">{r.time}</td>
                <td className="p-2 tabular-nums">{r.attempts}</td>
                <td className={`p-2 font-semibold ${r.mastery.tone}`}>{r.mastery.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">Mastered = quiz score of 2/3 or better. Data is stored on this device only.</p>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-space-2 p-3">
      <div className="text-2xl font-bold sm:text-3xl">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
