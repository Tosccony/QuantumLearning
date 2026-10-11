"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLANET_ICON } from "@/components/KidsRail";
import Icon from "@/components/ui/Icon";
import { Flag, Mark, Perf, Window } from "@/components/ui/primitives";
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

type Mastery = { label: "Not started" | "Mastered" | "Developing" };

function mastery(s: State, id: number): Mastery {
  const l = s.levels[id];
  if (!l?.completed) return { label: "Not started" };
  return l.quizCorrect / l.quizTotal >= 2 / 3 ? { label: "Mastered" } : { label: "Developing" };
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
      <main className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md flex-col justify-center gap-5 px-4 py-8">
        <Window as="form" className="flex flex-col gap-4 p-5 sm:p-6" onSubmit={(e: React.FormEvent) => { e.preventDefault(); if (+answer === gate.a * gate.b) setUnlocked(true); }}>
          <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
          <h1 className="display flex items-center gap-3 text-3xl">
            <Icon name="grownups" size={28} />
            Grown-ups only
          </h1>
          <label htmlFor="gate" className="text-lg">To continue, what is <span className="code">{gate.a} × {gate.b}</span>?</label>
          <input id="gate" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} className="field !min-h-12 code !text-xl" autoComplete="off" />
          <button className="keycap-xl keycap-paper-primary">Enter</button>
        </Window>
        <Link href="/explorer" className="keycap self-center">
          <Icon name="back" size={18} />
          Back to the mission map
        </Link>
      </main>
    );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-3 py-6 sm:px-6 print:text-black">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/explorer" className="keycap !px-3" aria-label="Back to the mission map">
          <Icon name="back" size={20} />
          <span className="hidden sm:inline">Map</span>
        </Link>
        <h1 className="display min-w-0 flex-1 text-3xl sm:text-4xl">Dashboard · {state.name || "Explorer"}</h1>
        <div className="flex gap-1 pt-2" role="tablist" aria-label="Dashboard view">
          {(["parent", "teacher"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`dashboard-${t}`}
              aria-controls="dashboard-panel"
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === "Home" ? "parent" : event.key === "End" ? "teacher" : tab === "parent" ? "teacher" : "parent";
                setTab(next);
                document.getElementById(`dashboard-${next}`)?.focus();
              }}
              onClick={() => setTab(t)}
              className={`frame relative min-h-11 px-5 label ${tab === t ? "frame-active text-paper" : "text-fog hover:text-paper"}`}
            >
              {tab === t && <Flag className="absolute -top-[11px] left-2" width={16} />}
              {t}
            </button>
          ))}
        </div>
      </header>
      <h1 className="display hidden text-3xl print:block">Quantum Quest · {state.name || "Explorer"}</h1>
      <div id="dashboard-panel" role="tabpanel" aria-labelledby={`dashboard-${tab}`}>
        {tab === "parent" ? <ParentView s={state} /> : <TeacherView s={state} />}
      </div>
      <button
        type="button"
        className="keycap self-start !border-bad !text-bad print:hidden"
        onClick={() => { if (confirm("Erase all progress on this device? This can't be undone.")) reset(); }}
      >
        <Icon name="reset" size={18} />
        Reset all progress on this device
      </button>
    </main>
  );
}

function Section({ title, children, className = "", id }: { title: string; children: React.ReactNode; className?: string; id: string }) {
  return (
    <Window as="section" className={`flex flex-col gap-3 p-5 sm:p-6 ${className}`} aria-labelledby={id}>
      <h2 id={id} className="display text-2xl">{title}</h2>
      {children}
    </Window>
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
    s.streak > 1 ? `On a ${s.streak}-day streak — short daily sessions help ideas stick.` : "Try a 5-minute session each day to build a streak.",
    developing.length ? `Worth revisiting together: ${developing.map((p) => p.concept).join(", ")} (quiz under 2/3).` : done.length ? "Every finished planet has a strong quiz score." : "",
    done.some((p) => p.id === 4) ? "Ask: “Can you explain entanglement using two socks?” Explaining in their own words is the goal." : "",
  ].filter(Boolean);

  const suggestions = [...developing.map((p) => p.id), ...done.map((p) => p.id).reverse()].slice(0, 2);
  if (next && suggestions.length < 2) suggestions.push(next.id);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Section id="week-h" title="This week" className="md:col-span-2">
        <p className="text-[#46587a]">
          <span className="code text-navy-ink">{weekMin}</span> minutes played · <span className="code text-navy-ink">{week.reduce((a, w) => a + w.xp, 0)}</span> XP earned
        </p>
        <div className="graticule flex h-48 items-end gap-2 border border-paper-3 px-2 pt-6 sm:gap-4" role="img" aria-label="XP earned each day this week">
          {week.map((w) => (
            <div key={w.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="code text-xs text-[#46587a]">{w.xp || ""}</span>
              <div className="rise w-full max-w-12 bg-navy-ink" style={{ height: `${(w.xp / max) * 110}px`, minHeight: 3 }} />
              <span className="code text-xs uppercase tracking-[0.1em] text-navy-ink">{w.day}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section id="insights-h" title="Learning insights">
        <ul className="flex list-[square] flex-col gap-2 pl-5 text-lg">{insights.map((i) => <li key={i}>{i}</li>)}</ul>
      </Section>
      <Section id="offline-h" title="Try together offline">
        <ul className="flex flex-col gap-3 text-lg">
          {suggestions.map((id) => (
            <li key={id} className="border-t border-paper-3 pt-3 first:border-t-0 first:pt-0">
              <span className="label block text-[#46587a]">{PLANETS[id - 1].concept}</span>
              {ACTIVITIES[id]}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="milestones-h" title="Milestones" className="md:col-span-2">
        {done.length === 0 ? (
          <p className="text-[#46587a]">Milestones appear here as badges are earned.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {done.map((p) => (
              <li key={p.id} className="frame flex min-h-14 items-center gap-3 px-3 py-2 text-paper print:border-black print:bg-white print:text-black">
                <Icon name={PLANET_ICON[p.id]} size={24} className="shrink-0 text-ice print:text-black" />
                <span className="flex-1">{p.badge} badge</span>
                <span className="code text-xs text-fog print:text-black">{new Date(s.levels[p.id].completedAt!).toLocaleDateString()}</span>
                <Mark kind="done" size={16} />
              </li>
            ))}
            {s.badges.length === 7 && (
              <li className="frame frame-active relative flex min-h-14 items-center gap-3 px-3 py-2 text-paper print:border-black print:bg-white print:text-black">
                <Flag className="absolute -top-[11px] left-2" width={16} />
                <Icon name="rocket" size={24} className="shrink-0 text-ice print:text-black" />
                <span className="display text-lg">Completed the whole Quantum Galaxy!</span>
              </li>
            )}
          </ul>
        )}
      </Section>
    </div>
  );
}

function MasteryCell({ m }: { m: Mastery }) {
  if (m.label === "Mastered")
    return (
      <span className="flex items-center gap-2 font-semibold">
        <span className="grid h-6 w-6 place-items-center bg-navy-ink print:hidden"><Mark kind="done" size={12} /></span>
        {m.label}
      </span>
    );
  if (m.label === "Developing")
    return (
      <span className="flex items-center gap-2 font-semibold">
        <Icon name="warn" size={18} className="print:hidden" />
        {m.label}
      </span>
    );
  return <span className="text-[#46587a]">{m.label}</span>;
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
    <Window as="section" className="flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="report-h">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="report-h" className="display flex-1 text-2xl">Progress report</h2>
        <button type="button" className="keycap-paper print:hidden" onClick={download}>
          <Icon name="download" size={18} />
          Download CSV
        </button>
        <button type="button" className="keycap-paper print:hidden" onClick={() => window.print()}>
          <Icon name="print" size={18} />
          Print / PDF
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Lessons completed" value={`${s.badges.length}/7`} />
        <Kpi label="Quiz accuracy" value={totalQs ? `${Math.round((totalQuiz / totalQs) * 100)}%` : "—"} />
        <Kpi label="Time in lessons" value={fmtMin(Object.values(s.levels).reduce((a, l) => a + l.timeSec, 0))} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-lg">
          <thead>
            <tr className="border-b border-navy-ink">
              {["Planet", "Status", "Quiz", "Time", "Attempts", "Mastery"].map((h) => <th key={h} scope="col" className="label p-2 text-[#46587a]">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.planet} className="border-t border-paper-3">
                <td className="p-2">{r.planet}</td>
                <td className="p-2">{r.status}</td>
                <td className="code p-2">{r.quiz}</td>
                <td className="code p-2">{r.time}</td>
                <td className="code p-2">{r.attempts}</td>
                <td className="p-2"><MasteryCell m={r.mastery} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-[#46587a]">Mastered = quiz score of 2/3 or better. Data is stored on this device only.</p>
    </Window>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-paper-3 bg-paper-2 p-3">
      <div className="code text-2xl font-bold sm:text-3xl">{value}</div>
      <div className="label-sm text-[#46587a]">{label}</div>
    </div>
  );
}
