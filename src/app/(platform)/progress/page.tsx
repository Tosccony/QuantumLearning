"use client";

import Link from "next/link";
import { modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { PLANETS, xpLevel, XP_PER_LEVEL } from "@/lib/levels";
import { useProgress, type State } from "@/lib/progress";
import { certificate, moduleStatus, trackProgress, type SkillStatus } from "@/lib/skills";

type Node = { id: string; track: TrackId; row: number; label: string; href: string; status: SkillStatus; requires: string[] };

// Cross-track links that show how the tracks build on each other.
const BRIDGES: [string, string][] = [["e7", "s1"], ["s4", "r1"], ["s6", "d4"], ["d5", "r4"], ["d6", "r5"], ["s2", "d1"]];

function nodes(s: State): Node[] {
  const out: Node[] = PLANETS.map((p, i) => ({
    id: `e${p.id}`, track: "explorer", row: i, label: p.concept, href: `/planet/${p.id}`,
    status: s.levels[p.id]?.completed ? "done" : i === 0 || s.levels[p.id - 1]?.completed ? "available" : "locked",
    requires: i ? [`e${p.id - 1}`] : [],
  }));
  for (const t of ["student", "developer", "researcher"] as const)
    modulesOf(t).forEach((m, i) => out.push({ id: m.id, track: t, row: i, label: m.skill, href: `/learn/${m.id}`, status: moduleStatus(s, m), requires: m.requires }));
  return out;
}

const COLS: TrackId[] = ["explorer", "student", "developer", "researcher"];
const ROW = 74;

export default function ProgressPage() {
  const { state, ready } = useProgress();
  if (!ready) return null;
  const ns = nodes(state);
  const pos = (n: Node) => ({ x: (COLS.indexOf(n.track) + 0.5) * 25, y: 40 + n.row * ROW });
  const byId = Object.fromEntries(ns.map((n) => [n.id, n]));
  const height = 40 + 7 * ROW;
  const doneCount = ns.filter((n) => n.status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <h1 className="text-3xl font-bold">Your progress</h1>
          <Link href="/roadmaps" className="mt-2 inline-block text-sm underline">Plan your next step with Roadmaps →</Link>
          <p className="mt-1 text-muted">{state.name ? `${state.name} · ` : ""}Skills unlock as you finish modules. Certificates arrive when you complete a track.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="XP" value={state.xp} sub={`Level ${xpLevel(state.xp)} · ${XP_PER_LEVEL - (state.xp % XP_PER_LEVEL)} to next`} />
        <Stat label="Day streak" value={state.streak} sub="🔥 keep it going" />
        <Stat label="Skills" value={`${doneCount}/${ns.length}`} sub="in the skill tree" />
        <Stat label="Circuits run" value={state.labRuns} sub="on Qiskit" />
        <Stat label="Projects shared" value={state.projects.length} sub={`${state.starred.length} starred`} />
      </div>

      <section className="panel p-4" aria-label="Skill tree">
        <h2 className="mb-1 text-xl font-semibold">Skill tree</h2>
        <p className="mb-4 text-sm text-muted">Solid lines are prerequisites within a track. Dashed lines show where one track feeds another.</p>
        <div className="overflow-x-auto">
          <div className="relative min-w-[720px]" style={{ height }}>
            <div className="absolute inset-x-0 top-0 grid grid-cols-4 text-center text-sm font-semibold">
              {COLS.map((c) => { const t = TRACKS.find((x) => x.id === c)!; return <div key={c} style={{ color: t.color }}>{t.icon} {t.name}</div>; })}
            </div>
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
              {ns.flatMap((n) => n.requires.map((r) => ({ a: byId[r], b: n, dashed: false })))
                .concat(BRIDGES.map(([a, b]) => ({ a: byId[a], b: byId[b], dashed: true })))
                .map(({ a, b, dashed }, i) => {
                  const p = pos(a), q = pos(b);
                  const lit = a.status === "done";
                  return (
                    <path
                      key={i}
                      d={`M${p.x},${p.y + 18} C${p.x},${(p.y + q.y) / 2 + 20} ${q.x},${(p.y + q.y) / 2 - 20} ${q.x},${q.y - 18}`}
                      fill="none"
                      stroke={lit ? "var(--good)" : "#ffffff30"}
                      strokeWidth={lit ? 2 : 1.25}
                      strokeDasharray={dashed ? "4 4" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
            </svg>
            {ns.map((n) => {
              const p = pos(n);
              const color = TRACKS.find((t) => t.id === n.track)!.color;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className={`absolute flex w-[21%] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl px-2.5 py-2 text-xs ring-1 transition hover:scale-[1.03] ${n.status === "done" ? "bg-good/20 ring-good" : n.status === "available" ? "bg-panel ring-white/40" : "bg-panel/50 text-muted ring-white/10"}`}
                  style={{ left: `${p.x}%`, top: p.y }}
                  aria-label={`${n.label}: ${n.status}`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: n.status === "locked" ? "#ffffff20" : color, color: "#0b1033" }}>
                    {n.status === "done" ? "✓" : n.status === "locked" ? "🔒" : "•"}
                  </span>
                  <span className="truncate font-medium">{n.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Certificates">
        <h2 className="mb-3 text-xl font-semibold">Certificates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((t) => {
            const c = certificate(state, t.id);
            const p = trackProgress(state, t.id);
            return (
              <div key={t.id} className={`panel flex flex-col gap-2 p-4 ${c ? "ring-2" : ""}`} style={c ? { ["--tw-ring-color" as string]: t.color } : undefined}>
                <span className="text-3xl" aria-hidden>{c ? "🏅" : t.icon}</span>
                <h3 className="font-semibold">{t.certificate}</h3>
                <p className="text-sm text-muted">{t.name} track · {p.done}/{p.total}</p>
                {c ? (
                  <Link href={`/certificate/${t.id}`} className="pbtn-primary mt-auto">View & print</Link>
                ) : (
                  <Link href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className="pbtn-ghost mt-auto">{p.done ? "Continue" : "Start"}</Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}
