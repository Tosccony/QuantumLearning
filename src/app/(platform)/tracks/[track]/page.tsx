"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { certificate, moduleStatus, trackProgress } from "@/lib/skills";

export default function TrackPage() {
  const { track } = useParams<{ track: string }>();
  const t = TRACKS.find((x) => x.id === track && x.id !== "explorer");
  const { state, ready } = useProgress();
  if (!t) notFound();
  if (!ready) return null;

  const mods = modulesOf(t.id as TrackId);
  const p = trackProgress(state, t.id);
  const cert = certificate(state, t.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <Link href="/learn" className="text-sm text-muted hover:text-ink">← All tracks</Link>
          <h1 className="flex items-center gap-3 text-3xl font-bold"><span aria-hidden>{t.icon}</span> {t.name} track</h1>
          <p className="text-muted">{t.tagline}</p>
        </header>
        <ol className="flex flex-col gap-3">
          {mods.map((m, i) => {
            const st = moduleStatus(state, m);
            return (
              <li key={m.id}>
                <Link href={`/learn/${m.id}`} className="panel flex items-start gap-4 p-4 transition hover:ring-white/30">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${st === "done" ? "bg-good text-space" : st === "available" ? "bg-accent text-white" : "bg-white/10 text-muted"}`}
                    aria-label={st}
                  >
                    {st === "done" ? "✓" : i + 1}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-semibold">{m.title}</h2>
                    <p className="mt-1 text-sm text-muted">{m.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">⏱ {m.minutes} min</span>
                      <span className="chip">⚛ {m.circuit.qubits}-qubit circuit</span>
                      <span className="chip">🧠 {m.skill}</span>
                      {st === "locked" && <span className="chip">Recommended after: {m.requires.join(", ").toUpperCase()}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="panel p-5">
          <p className="text-sm text-muted">Your progress</p>
          <p className="text-3xl font-bold">{p.done}/{p.total}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(p.done / p.total) * 100}%`, background: t.color }} />
          </div>
          <p className="mt-4 text-sm">🏅 Complete every module to earn the <b>{t.certificate}</b> certificate.</p>
          {cert ? (
            <Link href={`/certificate/${t.id}`} className="pbtn-primary mt-3 w-full">View certificate</Link>
          ) : (
            <Link href={`/learn/${(mods.find((m) => moduleStatus(state, m) === "available") ?? mods[0]).id}`} className="pbtn-primary mt-3 w-full">
              {p.done ? "Continue" : "Start the track"} →
            </Link>
          )}
        </div>
        <div className="panel p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Every module follows the same loop</p>
          <p className="mt-2">📘 Learn the idea → 🧩 Build the circuit → ▶️ Run it on Qiskit → 💡 Understand it with the tutor → 🌍 Share your variation.</p>
        </div>
      </aside>
    </div>
  );
}
