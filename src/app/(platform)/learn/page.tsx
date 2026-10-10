"use client";

import Link from "next/link";
import { modulesOf, TRACKS } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

export default function LearnCatalog() {
  const { state, ready } = useProgress();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Choose your track</h1>
        <p className="mt-1 text-muted">Four paths from first steps to research, plus deep-dive concepts. Every lesson ends with a real circuit you run on Qiskit.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => {
          const p = ready ? trackProgress(state, t.id) : { done: 0, total: 0 };
          const href = t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`;
          const mins = t.id === "explorer" ? 30 : modulesOf(t.id).reduce((a, m) => a + m.minutes, 0);
          return (
            <Link key={t.id} href={href} className="panel group flex flex-col gap-3 p-5 transition hover:ring-white/30">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: `${t.color}30` }} aria-hidden>{t.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{t.name} track</h2>
                  <p className="text-sm text-muted">{t.audience}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{t.tagline}</p>
              <div className="mt-auto flex items-center gap-3 text-xs text-muted">
                <span>{p.total} {t.id === "explorer" ? "planets" : "modules"} · ~{mins} min</span>
                <span>🏅 Certificate: {t.certificate}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={p.done} aria-valuemax={p.total} aria-label={`${t.name} progress`}>
                <div className="h-full rounded-full" style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%`, background: t.color }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
