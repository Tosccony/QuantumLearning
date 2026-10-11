"use client";

import Link from "next/link";
import { useState } from "react";
import { TRACKS } from "@/lib/curriculum";
import { roadmapTopics } from "@/lib/roadmaps";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

export default function RoadmapsPage() {
  const [query, setQuery] = useState("");
  const { state, ready } = useProgress();
  const tracks = TRACKS.filter(t => `${t.name} ${t.audience} ${t.tagline} ${roadmapTopics(t.id).map(n => n.title).join(" ")}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <div className="flex flex-col gap-8">
    <header className="panel relative overflow-hidden p-6 sm:p-10">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-on">Learn → Build → Understand</p>
      <h1 className="text-4xl font-bold sm:text-5xl">Your quantum journey,<br />one discovery at a time.</h1>
      <p className="mt-4 max-w-2xl text-muted">Find your path from curious explorer to quantum researcher. Follow connected topics, learn here, and explore videos and trusted resources along the way.</p>
      <label className="mt-6 block max-w-xl"><span className="mb-2 block text-sm font-medium">Find a roadmap or topic</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try entanglement, Qiskit, or error correction…" className="w-full rounded-xl border border-white/20 bg-space px-4 py-3 focus-visible:outline-2 focus-visible:outline-on" /></label>
    </header>
    <section aria-label="Learning roadmaps" className="grid gap-5 md:grid-cols-2">
      {tracks.map(t => { const p = trackProgress(state, t.id); const topics = roadmapTopics(t.id); return <Link key={t.id} href={`/roadmaps/${t.id}`} className="panel flex flex-col gap-4 p-6 transition hover:bg-panel focus-visible:outline-2 focus-visible:outline-on">
        <div className="flex items-center gap-3"><span className="text-4xl" aria-hidden>{t.icon}</span><div><h2 className="text-2xl font-bold">{t.name} roadmap</h2><p className="text-sm text-muted">{t.audience}</p></div></div>
        <p className="text-muted">{t.tagline}</p><div className="flex flex-wrap gap-2">{topics.slice(0, 4).map(n => <span key={n.id} className="chip">{n.title}</span>)}<span className="chip">{topics.length} topics</span></div>
        <div className="mt-auto"><div className="mb-2 flex justify-between text-sm"><span>{ready ? `${p.done}/${p.total} completed` : "Loading progress…"}</span><span style={{ color: t.color }}>{ready && p.done ? "Continue journey →" : "Explore path →"}</span></div><div role="progressbar" aria-label={`${t.name} completion`} aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={ready ? p.done : 0} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full" style={{ width: `${ready ? p.done / p.total * 100 : 0}%`, background: t.color }} /></div></div>
      </Link>; })}
    </section>
    {!tracks.length && <p role="status" className="panel p-6">No roadmaps match “{query}”. Try a broader topic or clear the search.</p>}
    <section className="grid gap-4 sm:grid-cols-3" aria-label="How roadmaps work">{[["01 · Follow the path", "Explore prerequisites and see what to learn next."], ["02 · Learn your way", "Combine our lessons and games with external videos and reading."], ["03 · Put it into practice", "Run real Qiskit circuits, complete checks, and share your work."]].map(([title, text]) => <div key={title} className="panel p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-muted">{text}</p></div>)}</section>
    <p className="text-sm text-muted">Lesson progress, bookmarks, and notes are saved on this device. <Link className="underline" href="/progress">View XP, streaks, and certificates</Link>.</p>
  </div>;
}
