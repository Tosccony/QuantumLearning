"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listProjects, type Project } from "@/lib/community";
import { useProgress } from "@/lib/progress";

export default function Community() {
  const { state } = useProgress();
  const [sort, setSort] = useState<"stars" | "new">("stars");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      listProjects(sort, q).then((p) => { setItems(p); setError(null); }).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [sort, q]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-bold">Community circuits</h1>
          <p className="mt-1 text-muted">Every project was re-run on Qiskit when it was published. Star the ones you like, or fork them into your Lab.</p>
        </div>
        <Link href="/lab" className="pbtn-primary">+ New circuit</Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search circuits, tags…" aria-label="Search projects" className="w-64 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-accent" />
        <div className="flex rounded-lg bg-white/5 p-0.5 text-sm" role="radiogroup" aria-label="Sort">
          {(["stars", "new"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={sort === s} onClick={() => setSort(s)} className={`rounded-md px-3 py-1 ${sort === s ? "bg-white/15 font-semibold" : "text-muted"}`}>
              {s === "stars" ? "★ Most starred" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      {!items && !error && <p className="text-muted">Loading…</p>}
      {items?.length === 0 && <p className="text-muted">No circuits match. Build one and share it!</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((p) => (
          <Link key={p.id} href={`/community/${p.id}`} className="panel flex flex-col gap-3 p-4 transition hover:ring-white/30">
            <MiniHistogram counts={p.counts} />
            <div>
              <h2 className="font-semibold leading-snug">{p.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs">
              {p.tags.slice(0, 3).map((t) => <span key={t} className="chip">#{t}</span>)}
              <span className="ml-auto text-muted">{p.circuit.qubits}q · {p.circuit.ops.length} gates</span>
            </div>
            <div className="flex items-center gap-3 border-t border-white/10 pt-2 text-xs text-muted">
              <span className="truncate">by {p.author}{state.projects.includes(p.id) ? " (you)" : ""}</span>
              <span className="ml-auto">{state.starred.includes(p.id) ? "★" : "☆"} {p.stars}</span>
              <span>⑂ {p.forks}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniHistogram({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 32);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex h-16 items-end gap-0.5 rounded-lg bg-[#070a24] p-2" aria-hidden>
      {entries.map(([k, v]) => <div key={k} className="flex-1 rounded-t-sm bg-accent" style={{ height: `${(v / max) * 100}%` }} title={`${k}: ${v}`} />)}
    </div>
  );
}
