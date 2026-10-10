"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { moduleById, type Track } from "@/lib/curriculum";
import { firstStartable, ROADMAP_STORAGE_KEY, roadmapTopics, sanitizePersonal, topicStatus, type Personal } from "@/lib/roadmaps";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

const labels = { done: "Completed", available: "Ready to learn", locked: "Prerequisites remaining" };

// Only writes (strict) rethrow storage errors; reads treat them as an empty store.
function readStore(strict = false): Personal {
  try { return sanitizePersonal(JSON.parse(localStorage.getItem(ROADMAP_STORAGE_KEY) || "{}")); } catch (e) { if (strict && !(e instanceof SyntaxError)) throw e; return {}; }
}

export default function RoadmapView({ track }: { track: Track }) {
  const topics = roadmapTopics(track.id);
  const { state, ready } = useProgress();
  const [selected, setSelected] = useState(topics[0].id);
  const [query, setQuery] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [personal, setPersonal] = useState<Personal>({});
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"map" | "list">("map");
  useEffect(() => {
    setPersonal(readStore());
    const id = new URLSearchParams(window.location.search).get("topic");
    if (id && roadmapTopics(track.id).some(t => t.id === id)) setSelected(id);
    setLoaded(true);
  }, [track.id]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === ROADMAP_STORAGE_KEY || e.key === null) setPersonal(readStore()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // Read-modify-write of only this topic, so two open tabs don't overwrite each other.
  function save(id: string, change: (current: Personal[string]) => Partial<Personal[string]>) {
    const apply = (all: Personal): Personal => ({ ...all, [id]: { ...all[id], ...change(all[id] ?? {}) } });
    try {
      const next = apply(readStore(true));
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(next));
      setPersonal(next);
    } catch { setMessage("Device storage is unavailable. Changes will last for this visit only."); setPersonal(apply); }
  }
  const topic = topics.find(n => n.id === selected)!;
  const status = topicStatus(state, topic);
  const { done } = trackProgress(state, track.id);
  // Counts and statuses come from the shared rules in skills.ts.
  const next = topics.find(n => topicStatus(state, n) === "available");
  // A missing prerequisite may itself be locked, so point at the first lesson that can actually be started on the way to it.
  const blocked = topics.flatMap(n => n.requires).find(id => moduleById(id) && !state.modules[id]);
  const startable = blocked ? firstStartable(state, blocked) : null;
  const continueHref = next?.lesson ?? (done === topics.length ? `/certificate/${track.id}` : startable ? `/learn/${startable}` : topic.lesson);
  const continueLabel = next ? "Continue learning →" : done === topics.length ? "View certificate →" : "Start prerequisites →";
  const filtered = topics.filter(n => `${n.title} ${n.summary}`.toLowerCase().includes(query.toLowerCase().trim()) && (!onlySaved || personal[n.id]?.bookmarked));
  async function share() {
    const url = new URL(window.location.href); url.search = ""; url.searchParams.set("topic", selected);
    try { await navigator.clipboard.writeText(url.toString()); setMessage("Topic link copied. Personal progress and notes are private to this device."); } catch { setMessage(`Copy this link: ${url.toString()}`); }
  }
  if (!ready || !loaded) return <p role="status" className="panel p-6">Loading your roadmap…</p>;
  return <div className="roadmap-print flex flex-col gap-6">
    <Link href="/roadmaps" className="text-sm text-muted hover:text-ink">← All roadmaps</Link>
    <header className="panel p-6"><p className="text-sm text-muted">{track.audience}</p><h1 className="mt-2 text-3xl font-bold">{track.icon} {track.name} roadmap</h1><p className="mt-3 text-muted">{track.tagline}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3"><span className="font-semibold">{done}/{topics.length} topics completed</span><div className="h-2 w-40 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Roadmap completion" aria-valuemin={0} aria-valuemax={topics.length} aria-valuenow={done}><div className="h-full" style={{ width: `${done / topics.length * 100}%`, background: track.color }} /></div><Link className="pbtn-primary" href={continueHref}>{continueLabel}</Link><button className="pbtn-ghost print:hidden" onClick={share}>Share topic</button><button className="pbtn-ghost print:hidden" onClick={() => window.print()}>Print / PDF</button></div>
    </header>
    <div className="flex flex-wrap items-center gap-3 print:hidden"><label className="flex-1"><span className="sr-only">Search topics</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics…" className="w-full rounded-xl border border-white/20 bg-space px-4 py-2" /></label><button className="pbtn-ghost" aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}>★ Bookmarked only</button><button className="pbtn-ghost" aria-pressed={view === "list"} onClick={() => setView(view === "map" ? "list" : "map")}>List view</button><div className="hidden items-center gap-2 sm:flex"><button className="pbtn-ghost" aria-label="Zoom out" disabled={zoom <= .8} onClick={() => setZoom(Math.max(.8, zoom - .1))}>−</button><button className="pbtn-ghost" aria-label={`Reset zoom (${Math.round(zoom * 100)}%)`} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button className="pbtn-ghost" aria-label="Zoom in" disabled={zoom >= 1.4} onClick={() => setZoom(Math.min(1.4, zoom + .1))}>+</button></div></div>
    <p role="status" className="text-sm text-muted print:hidden">{message || "Select a topic to explore. Prerequisites guide the order; you can preview any lesson."}</p>
    <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="panel overflow-auto p-5" aria-label="Connected learning path">
        <div className="mb-5 flex flex-wrap gap-2 text-xs"><span className="chip">✓ Completed</span><span className="chip">○ Ready to learn</span><span className="chip">◇ Prerequisites remaining</span></div>
        <ol className={`roadmap-nodes relative flex flex-col ${view === "map" ? "gap-9" : "gap-3"}`} style={{ zoom }}>
          {filtered.map(n => { const s = topicStatus(state, n); const i = topics.indexOf(n); return <li key={n.id} className="relative">
            {view === "map" && filtered.length === topics.length && i < topics.length - 1 && topics[i + 1].requires.includes(n.id) && <span aria-hidden className="absolute left-1/2 top-full h-9 border-l-2 border-dashed border-white/30" />}
            <button onClick={() => { setSelected(n.id); setMessage(""); }} aria-pressed={selected === n.id} aria-controls="topic-details" className={`relative flex w-full items-center gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-on ${selected === n.id ? "border-on bg-space" : s === "done" ? "border-good/50 bg-good/10" : "border-white/20 bg-space/60 hover:bg-space"}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10" aria-hidden>{s === "done" ? "✓" : i + 1}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{n.title}</span><span className="text-xs text-muted">{labels[s]}{personal[n.id]?.started && s !== "done" ? " · In progress" : ""}{n.minutes ? ` · ${n.minutes} min` : ""}</span></span>{personal[n.id]?.bookmarked && <span aria-label="Bookmarked">★</span>}
            </button>
          </li>; })}
        </ol>{!filtered.length && <p className="py-8 text-center text-muted">No matching topics. Clear the search or bookmark filter.</p>}
        <div className="mt-8 border-t border-white/10 pt-5"><h2 className="font-semibold">Your destination</h2><p className="mt-2 text-sm text-muted">{track.certificate} · Earned by completing the platform’s {track.id === "explorer" ? "planet games" : "lessons"}.</p><Link className="mt-3 inline-block text-sm underline" href="/progress">View progress and certificates →</Link></div>
      </section>
      <section id="topic-details" className="panel p-6 lg:sticky lg:top-24" aria-label="Selected topic details">
        <div className="flex items-start gap-3"><div className="flex-1"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: track.color }}>{track.name} · {labels[status]}</p><h2 className="mt-2 text-2xl font-bold">{topic.title}</h2></div><button aria-label="Bookmark this topic" aria-pressed={!!personal[topic.id]?.bookmarked} className="pbtn-ghost print:hidden" onClick={() => save(topic.id, c => ({ bookmarked: !c.bookmarked }))}>{personal[topic.id]?.bookmarked ? "★" : "☆"}</button></div>
        <p className="mt-4 leading-relaxed text-muted">{topic.summary}</p>
        <div className="mt-4"><h3 className="text-sm font-semibold">Prerequisites</h3><div className="mt-2 flex flex-wrap gap-2">{topic.requires.length ? topic.requires.map(id => { const local = topics.find(n => n.id === id); const prerequisite = moduleById(id); return local ? <button key={id} onClick={() => setSelected(id)} className="chip underline">{local.title} {topicStatus(state, local) === "done" ? "✓" : ""}</button> : <Link key={id} href={`/roadmaps/${prerequisite?.track ?? "student"}?topic=${id}`} className="chip underline">{prerequisite?.skill ?? id} {state.modules[id] ? "✓" : ""}</Link>; }) : <span className="text-sm text-muted">Start here — no prior topics required.</span>}</div></div>
        <div className="mt-5 flex flex-wrap gap-2"><Link href={topic.lesson} className="pbtn-primary" onClick={() => save(topic.id, () => ({ started: true }))}>{status === "done" ? "Revisit lesson" : "Start lesson"} →</Link>{topic.lab && <Link href={topic.lab} className="pbtn-ghost">Open in Quantum Lab</Link>}</div>
        <h3 className="mt-7 font-semibold">Watch & read</h3><p className="mt-1 text-xs text-muted">Free learning resources. Overview videos and full courses may cover several topics; Explorer reading is for guided learning with a grown-up.</p>
        <ul className="mt-3 space-y-3">{topic.resources.map(r => <li key={r.url} className="rounded-xl bg-space/60 p-3"><a href={r.url} target="_blank" rel="noopener noreferrer" className="block font-medium underline decoration-white/20 underline-offset-4 hover:decoration-on">{r.kind === "Video" ? "▶" : "↗"} {r.title}<span className="sr-only"> (opens in a new tab)</span></a><p className="mt-1 text-xs text-muted">{r.provider} · {r.kind} · {r.level}</p><label className="mt-2 flex items-center gap-2 text-xs print:hidden"><input type="checkbox" checked={!!personal[topic.id]?.reviewed?.includes(r.url)} onChange={e => save(topic.id, c => ({ reviewed: e.target.checked ? [...(c.reviewed ?? []).filter(url => url !== r.url), r.url] : c.reviewed?.filter(url => url !== r.url) }))} />I reviewed this resource<span className="sr-only">: {r.title}</span></label></li>)}</ul>
        <div className="mt-6 rounded-xl border border-white/15 p-4"><h3 className="font-semibold">Try a challenge</h3><p className="mt-2 text-sm text-muted">{topic.challenge}</p>{topic.lab && <Link href="/community" className="mt-3 inline-block text-sm underline">Explore shared circuits →</Link>}</div>
        <label className="mt-6 block print:hidden"><span className="font-semibold">Personal notes</span><textarea value={personal[topic.id]?.note ?? ""} onChange={e => save(topic.id, () => ({ note: e.target.value.slice(0, 4000) }))} rows={4} maxLength={4000} placeholder="What did you discover? What do you want to try next?" className="mt-2 w-full rounded-xl border border-white/20 bg-space p-3 text-sm" /></label>
        <p className="mt-4 text-xs text-muted">Reviewing resources does not complete lessons or award XP. Finish the linked lesson or game to update your roadmap and certificate progress.</p>
      </section>
    </div>
  </div>;
}
