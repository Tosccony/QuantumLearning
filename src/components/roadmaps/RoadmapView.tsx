"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Flag, Heading, Mark, Notice, Perf, Stripe, Window, type MarkKind } from "@/components/ui/primitives";
import { EXPLORER_CIRCUITS, moduleById, modulesOf, type Track, type TrackId } from "@/lib/curriculum";
import { PLANETS } from "@/lib/levels";
import { firstStartable, ROADMAP_STORAGE_KEY, roadmapTopics, sanitizePersonal, topicStatus, type Personal } from "@/lib/roadmaps";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

const LABELS = { done: "Completed", available: "Ready to learn", locked: "Prerequisites remaining" } as const;
const CODE: Record<TrackId, string> = { explorer: "E", student: "S", developer: "D", researcher: "R", concepts: "C" };

/** Milestone notes between tiers, keyed by the index of the topic they follow. */
const MILESTONES: Partial<Record<TrackId, Record<number, string>>> = {
  explorer: {
    2: "At this point you have played with bits, a quantum coin and a treasure that is in many places at once. The next planets are about two qubits acting together.",
    4: "You can now run a gate machine. The last two planets look at algorithms and at the machines being built today.",
  },
  student: {
    2: "At this point you can describe one qubit, run H twice and read a phase. Everything from here uses two or more qubits.",
    4: "You have built entangled pairs and teleported a state. The last topic turns that into a first algorithm.",
  },
  developer: {
    2: "At this point you can write a Qiskit circuit, transpile it and read noisy counts. The rest of the path is algorithms.",
  },
  researcher: {
    2: "At this point you can read a density matrix and judge whether a code helps. The last three topics are estimation and variational methods.",
  },
  concepts: {
    1: "Two experiments down: a key you can share and a correlation no instruction sheet explains. Shor's algorithm needs phase estimation from the Researcher path first.",
  },
};

/** Edge code of any topic id (planet `e3` or module `s7`), in its own track's numbering. */
export function topicCode(id: string): string {
  if (id.startsWith("e")) return `E${id.slice(1).padStart(2, "0")}`;
  const m = moduleById(id);
  if (!m) return id.toUpperCase();
  const i = modulesOf(m.track).findIndex((x) => x.id === id);
  return `${CODE[m.track]}${String(i + 1).padStart(2, "0")}`;
}

// Only writes (strict) rethrow storage errors; reads treat them as an empty store.
function readStore(strict = false): Personal {
  try { return sanitizePersonal(JSON.parse(localStorage.getItem(ROADMAP_STORAGE_KEY) || "{}")); } catch (e) { if (strict && !(e instanceof SyntaxError)) throw e; return {}; }
}

type Tab = "roadmap" | "projects" | "tutor";

export default function RoadmapView({ track }: { track: Track }) {
  const topics = roadmapTopics(track.id);
  const { state, ready } = useProgress();
  const [selected, setSelected] = useState(topics[0].id);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("roadmap");
  const [query, setQuery] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [personal, setPersonal] = useState<Personal>({});
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"map" | "list">("map");
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPersonal(readStore());
    const id = new URLSearchParams(window.location.search).get("topic");
    if (id && roadmapTopics(track.id).some((t) => t.id === id)) { setSelected(id); setOpen(true); }
    setLoaded(true);
  }, [track.id]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === ROADMAP_STORAGE_KEY || e.key === null) setPersonal(readStore()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Read-modify-write of only this topic, so two open tabs don't overwrite each other.
  const save = useCallback((id: string, change: (current: Personal[string]) => Partial<Personal[string]>) => {
    const apply = (all: Personal): Personal => ({ ...all, [id]: { ...all[id], ...change(all[id] ?? {}) } });
    try {
      const next = apply(readStore(true));
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(next));
      setPersonal(next);
    } catch { setMessage("Device storage is unavailable. Changes will last for this visit only."); setPersonal(apply); }
  }, []);

  const topic = topics.find((n) => n.id === selected)!;
  const status = topicStatus(state, topic);
  const { done } = trackProgress(state, track.id);
  const learning = topics.filter((n) => personal[n.id]?.started && topicStatus(state, n) !== "done").length;
  const skipped = topics.filter((n) => personal[n.id]?.skipped && topicStatus(state, n) !== "done").length;
  const mins = topics.reduce((a, n) => a + (n.minutes ?? 0), 0);
  // Counts and statuses come from the shared rules in skills.ts.
  const next = topics.find((n) => topicStatus(state, n) === "available");
  // A missing prerequisite may itself be locked, so point at the first lesson that can actually be started on the way to it.
  const blocked = topics.flatMap((n) => n.requires).find((id) => moduleById(id) && !state.modules[id]);
  const startable = blocked ? firstStartable(state, blocked) : null;
  const continueHref = next?.lesson ?? (done === topics.length ? `/certificate/${track.id}` : startable ? `/learn/${startable}` : topic.lesson);
  const continueLabel = next ? "Continue learning" : done === topics.length ? "View certificate" : "Start prerequisites";
  const filtered = useMemo(
    () => topics.filter((n) => `${n.title} ${n.summary}`.toLowerCase().includes(query.toLowerCase().trim()) && (!onlySaved || personal[n.id]?.bookmarked)),
    [topics, query, onlySaved, personal],
  );

  const selIdx = filtered.findIndex((n) => n.id === selected);
  // With the drawer open the branch columns are narrow: the icon carries the label and the word stays for screen readers.
  const branchLabel = open ? "sr-only 2xl:not-sr-only" : "";
  const pick = (id: string) => { setSelected(id); setOpen(true); setMessage(""); };
  const close = () => { setOpen(false); nodeRefs.current[selected]?.focus(); };
  // Arrow keys walk the spine; Enter or Space (the button's own click) opens the drawer.
  const onSpineKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const j = e.key === "Home" ? 0 : e.key === "End" ? filtered.length - 1 : Math.min(filtered.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
    nodeRefs.current[filtered[j].id]?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected]);

  async function share() {
    const url = new URL(window.location.href); url.search = ""; url.searchParams.set("topic", selected);
    try { await navigator.clipboard.writeText(url.toString()); setMessage("Topic link copied. Personal progress and notes stay on this device."); } catch { setMessage(`Copy this link: ${url.toString()}`); }
  }

  if (!ready || !loaded) return <p role="status" className="frame px-4 py-3 text-fog">Loading your roadmap…</p>;

  return (
    <div className={`roadmap flex flex-col gap-5 ${open ? "lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6" : ""}`}>
      <div className="flex min-w-0 flex-col gap-5">
        {/* ------------------------------------------------------------ title bar */}
        <header className="flex flex-col gap-3 print:gap-2">
          <Link href="/roadmaps" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper print:hidden">
            <Icon name="back" size={16} /> All roadmaps
          </Link>
          <div className="frame">
            <Stripe track={track.id} />
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
                  <Icon name={track.id} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <Heading as="h1" code={`${topics.length} TOPICS${mins ? ` · ${mins} MIN` : ""}`}>{track.name} roadmap</Heading>
                  <p className="text-sm text-fog">{track.audience} · {track.tagline}</p>
                </div>
              </div>

              {/* Progress: one cell per topic, in path order. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex min-w-[200px] flex-1 gap-1" role="img" aria-label={`${done} of ${topics.length} topics completed, ${learning} learning, ${skipped} skipped`}>
                  {topics.map((n) => {
                    const s = topicStatus(state, n);
                    const p = personal[n.id];
                    const cls = s === "done" ? "border-ice bg-ice" : p?.skipped ? "border-[var(--line-strong)] cell-skipped" : p?.started ? "border-ice" : "border-[var(--line-strong)]";
                    return <span key={n.id} className={`relative h-3 flex-1 border ${cls}`} style={{ boxShadow: s === "done" ? `inset 0 0 0 1px ${track.color}` : undefined }} />;
                  })}
                </div>
                <p className="code text-xs text-fog">
                  <span className="text-paper">{Math.round((done / topics.length) * 100)}%</span> done · {done} completed · {learning} learning · {skipped} skipped
                </p>
              </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <Link className="keycap-primary" href={continueHref}><Icon name="flag" size={14} /> {continueLabel}</Link>
                  <button type="button" className="keycap" onClick={share}><Icon name="link" size={14} /> Share topic</button>
                  <button type="button" className="keycap" onClick={() => window.print()}><Icon name="print" size={14} /> Download PDF</button>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="flex" role="tablist" aria-label="Roadmap views">
              {([["roadmap", "Roadmap", "map"], ["projects", "Projects", "lab"], ["tutor", "Tutor", "tutor"]] as const).map(([id, label, icon]) => (
                <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)} className={`keycap -ml-px first:ml-0 ${tab === id ? "bg-ice text-navy-ink" : ""}`}>
                  <Icon name={icon} size={14} /> {label}
                </button>
              ))}
            </div>
            {tab === "roadmap" && (
              <>
                <label className="min-w-[200px] flex-1">
                  <span className="sr-only">Search topics</span>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics…" className="field" />
                </label>
                <button type="button" className={`keycap ${onlySaved ? "bg-ice text-navy-ink" : ""}`} aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}>
                  <Icon name={onlySaved ? "bookmark-filled" : "bookmark"} size={14} /> Bookmarked
                </button>
                <button type="button" className="keycap" aria-pressed={view === "list"} onClick={() => setView(view === "map" ? "list" : "map")}>
                  <Icon name={view === "map" ? "list" : "map"} size={14} /> {view === "map" ? "List view" : "Map view"}
                </button>
                <div className="hidden items-center sm:flex" role="group" aria-label="Zoom">
                  <button type="button" className="keycap !min-w-11 !px-0" aria-label="Zoom out" disabled={zoom <= 0.8} onClick={() => setZoom(Math.max(0.8, zoom - 0.1))}><Icon name="minus" size={14} /></button>
                  <button type="button" className="keycap -ml-px !px-3 code" aria-label={`Reset zoom (${Math.round(zoom * 100)}%)`} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
                  <button type="button" className="keycap -ml-px !min-w-11 !px-0" aria-label="Zoom in" disabled={zoom >= 1.4} onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}><Icon name="plus" size={14} /></button>
                </div>
              </>
            )}
          </div>
          {message && <Notice tone="good" role="status">{message}</Notice>}
        </header>

        {/* ------------------------------------------------------------ the map */}
        {tab === "roadmap" && (
          <section id="panel-roadmap" role="tabpanel" aria-labelledby="tab-roadmap" className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label="Learning path">
            <Perf />
            <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fog print:hidden" aria-label="Legend">
                <span className="label-sm">Marks</span>
                <span className="flex items-center gap-1.5"><Mark kind="done" size={14} /> completed, verified by the lesson</span>
                <span className="flex items-center gap-1.5"><Mark kind="available" size={14} /> ready</span>
                <span className="flex items-center gap-1.5"><Mark kind="locked" size={14} /> prerequisites remaining</span>
                <span className="flex items-center gap-1.5"><Flag width={11} /> selected</span>
                <span className="flex items-center gap-1.5"><Icon name="bookmark-filled" size={13} className="text-ice" /> bookmarked</span>
                <span className="flex items-center gap-1.5"><Icon name="flag" size={13} className="text-ice" /> learning</span>
                <span className="flex items-center gap-1.5"><span className="line-through decoration-2">title</span> skipped</span>
              </div>

              {view === "map" ? (
                <ol className="roadmap-map mx-auto flex w-full max-w-[1100px] flex-col" style={{ zoom }} aria-label={`${track.name} topics in order`}>
                  {filtered.map((n, i) => {
                    const s = topicStatus(state, n);
                    const p = personal[n.id] ?? {};
                    const isSel = n.id === selected;
                    const nextTopic = filtered[i + 1];
                    const linked = !!nextTopic && nextTopic.requires.includes(n.id);
                    // The path travelled lights up: every connector above the pressed node, plus completed links.
                    const lit = i < selIdx || (s === "done" && !!nextTopic && topicStatus(state, nextTopic) !== "locked");
                    const mark: MarkKind = s;
                    const cross = n.requires.filter((r) => !topics.some((t) => t.id === r));
                    const planet = n.source.kind === "planet" ? PLANETS.find((pl) => pl.id === n.source.id) : undefined;
                    const mod = n.source.kind === "module" ? moduleById(n.source.id) : undefined;
                    const circuit = mod?.circuit ?? (planet ? EXPLORER_CIRCUITS[planet.id] : undefined);
                    const lessonBranch = (
                      <Link href={n.lesson} className="frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-xs text-paper hover:border-[var(--line-strong)]" onClick={() => save(n.id, () => ({ started: true }))}>
                        <Icon name={planet ? "rocket" : "learn"} size={14} className="shrink-0 text-ice" />
                        <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>{planet ? "Game" : "Lesson"}</span>
                        <span className="min-w-0 truncate">{planet ? planet.name : mod?.title}</span>
                      </Link>
                    );
                    const circuitBranch = circuit ? (
                      <Link href={n.lab ?? `/lab?module=${n.id}`} className="frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-xs text-paper hover:border-[var(--line-strong)]">
                        <Icon name="chip" size={14} className="shrink-0 text-ice" />
                        <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>Circuit</span>
                        <span className="code min-w-0 truncate">{circuit.qubits}Q · {circuit.ops.length} gates</span>
                      </Link>
                    ) : null;
                    const resourcesBranch = (
                      <button type="button" onClick={() => pick(n.id)} className="frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:border-[var(--line-strong)]" aria-label={`${n.resources.length} resources for ${n.title}: open the topic`}>
                        <Icon name="video" size={14} className="shrink-0 text-ice" />
                        <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>Watch &amp; read</span>
                        <span className="min-w-0 truncate">{n.resources.length} free · {p.reviewed?.length ?? 0} reviewed</span>
                      </button>
                    );
                    const rightBranches = <div className="flex min-w-0 flex-col gap-2">{circuitBranch}{resourcesBranch}</div>;
                    const note = filtered.length === topics.length ? MILESTONES[track.id]?.[i] : undefined;
                    return (
                      <li key={n.id} className="relative">
                        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_28px_minmax(280px,440px)_28px_minmax(0,1fr)] lg:items-center">
                          <div className="hidden min-w-0 lg:flex lg:justify-end">{lessonBranch}</div>
                          <span className="hidden h-px bg-[var(--line-strong)] lg:block" aria-hidden />
                          <button
                            type="button"
                            ref={(el) => { nodeRefs.current[n.id] = el; }}
                            onClick={() => pick(n.id)}
                            onKeyDown={(e) => onSpineKey(e, i)}
                            aria-pressed={isSel}
                            aria-expanded={isSel && open}
                            aria-controls="topic-drawer"
                            aria-label={`${topicCode(n.id)} ${n.title}: ${LABELS[s]}${p.started && s !== "done" ? ", learning" : ""}${p.skipped && s !== "done" ? ", skipped" : ""}${p.bookmarked ? ", bookmarked" : ""}`}
                            className={`frame relative flex min-h-[64px] w-full items-center gap-3 px-3 py-3 text-left transition-colors ${isSel ? "frame-active" : "hover:border-[var(--line-strong)]"} ${s === "locked" ? "punched text-fog" : "text-paper"}`}
                          >
                            {isSel && <Flag className="absolute -top-[11px] right-3" width={16} />}
                            <span className="code w-8 shrink-0 text-xs text-fog">{topicCode(n.id)}</span>
                            <span className="min-w-0 flex-1">
                              <span className={`display block text-lg leading-tight ${p.skipped && s !== "done" ? "line-through decoration-2" : ""}`}>{n.title}</span>
                              <span className="label-sm mt-0.5 flex flex-wrap gap-x-3 text-fog">
                                <span>{LABELS[s]}</span>
                                {p.started && s !== "done" && <span className="flex items-center gap-1 text-ice"><Icon name="flag" size={11} /> learning</span>}
                                {n.minutes ? <span>{n.minutes} min</span> : null}
                                {cross.map((r) => <span key={r} className="code normal-case tracking-normal">needs {topicCode(r)}</span>)}
                              </span>
                            </span>
                            {p.bookmarked && <Icon name="bookmark-filled" size={14} className="shrink-0 text-ice" title="Bookmarked" />}
                            <Mark kind={mark} className="shrink-0" />
                          </button>
                          <span className="hidden h-px bg-[var(--line-strong)] lg:block" aria-hidden />
                          <div className="hidden min-w-0 lg:flex">{rightBranches}</div>
                          <div className="ml-6 grid grid-cols-3 gap-2 lg:hidden">
                            <Link href={n.lesson} className="frame flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper" onClick={() => save(n.id, () => ({ started: true }))} aria-label={`${planet ? "Play" : "Lesson"}: ${planet ? planet.name : mod?.title}`}>
                              <Icon name={planet ? "rocket" : "learn"} size={13} className="shrink-0 text-ice" /> {planet ? "Play" : "Lesson"}
                            </Link>
                            {circuit ? (
                              <Link href={n.lab ?? `/lab?module=${n.id}`} className="frame code flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper" aria-label={`Open the ${circuit.qubits}-qubit circuit in the Lab`}>
                                <Icon name="chip" size={13} className="shrink-0 text-ice" /> {circuit.qubits}Q · {circuit.ops.length}
                              </Link>
                            ) : <span className="frame frame-ghost flex min-h-10 items-center justify-center text-[0.72rem] text-fog" aria-hidden>game</span>}
                            <button type="button" onClick={() => pick(n.id)} className="frame flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper" aria-label={`${n.resources.length} resources for ${n.title}: open the topic`}>
                              <Icon name="video" size={13} className="shrink-0 text-ice" /> {n.resources.length} free
                            </button>
                          </div>
                        </div>
                        {i < filtered.length - 1 && (
                          <>
                            <span className={`mx-auto block h-8 w-0 border-l-2 ${lit ? "border-ice" : "border-[var(--line-strong)]"} ${linked ? "" : "border-dashed"}`} aria-hidden />
                            {note && (
                              <>
                                <p className="frame frame-ghost mx-auto flex w-full max-w-[460px] items-start gap-2 px-3 py-2 text-sm leading-relaxed text-fog">
                                  <Icon name="info" size={14} className="mt-1 shrink-0 text-ice" />
                                  <span>{note}</span>
                                </p>
                                <span className={`mx-auto block h-8 w-0 border-l-2 ${lit ? "border-ice" : "border-[var(--line-strong)]"}`} aria-hidden />
                              </>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                  {filtered.length === topics.length && (
                    <li className="flex flex-col items-center">
                      <span className={`block h-8 w-0 border-l-2 ${done === topics.length ? "border-ice" : "border-[var(--line-strong)]"}`} aria-hidden />
                      <Link href="/progress" className={`frame flex w-full max-w-[460px] items-center gap-3 px-3 py-3 text-paper hover:border-[var(--line-strong)] ${done === topics.length ? "frame-active" : "frame-ghost"}`}>
                        <Icon name="badge" size={20} className="shrink-0 text-ice" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-3"><span className="display text-lg leading-tight">{track.certificate}</span><span className="label-sm text-fog">destination</span></span>
                          <span className="text-xs text-fog">Earned by completing every {track.id === "explorer" ? "planet game" : "lesson"} on this path.</span>
                        </span>
                        {done === topics.length ? <Mark kind="done" /> : <span className="code text-xs text-fog">{done}/{topics.length}</span>}
                      </Link>
                    </li>
                  )}
                </ol>
              ) : (
                <table className="w-full border-collapse text-sm" aria-label={`${track.name} topics as a list`}>
                  <thead>
                    <tr className="label-sm text-left text-fog">
                      <th scope="col" className="border-b border-[var(--line)] px-2 py-2 font-semibold">Code</th>
                      <th scope="col" className="border-b border-[var(--line)] px-2 py-2 font-semibold">Topic</th>
                      <th scope="col" className="border-b border-[var(--line)] px-2 py-2 font-semibold">Status</th>
                      <th scope="col" className="hidden border-b border-[var(--line)] px-2 py-2 font-semibold sm:table-cell">Min</th>
                      <th scope="col" className="border-b border-[var(--line)] px-2 py-2 font-semibold"><span className="sr-only">Marks</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((n, i) => {
                      const s = topicStatus(state, n);
                      const p = personal[n.id] ?? {};
                      return (
                        <tr key={n.id} className={n.id === selected ? "bg-[rgba(111,230,255,0.08)]" : ""}>
                          <td className="code border-b border-[var(--line)] px-2 py-2 text-xs text-fog">{topicCode(n.id)}</td>
                          <td className="border-b border-[var(--line)] px-2 py-1">
                            <button type="button" ref={(el) => { nodeRefs.current[n.id] = el; }} onClick={() => pick(n.id)} onKeyDown={(e) => onSpineKey(e, i)} aria-pressed={n.id === selected} aria-controls="topic-drawer" className={`display min-h-11 text-left text-base hover:text-ice ${p.skipped && s !== "done" ? "line-through decoration-2" : ""}`}>
                              {n.title}
                            </button>
                          </td>
                          <td className="border-b border-[var(--line)] px-2 py-2 text-xs text-fog">{LABELS[s]}{p.started && s !== "done" ? " · learning" : ""}</td>
                          <td className="code hidden border-b border-[var(--line)] px-2 py-2 text-xs text-fog sm:table-cell">{n.minutes ?? "—"}</td>
                          <td className="border-b border-[var(--line)] px-2 py-2"><span className="flex items-center justify-end gap-2">{p.bookmarked && <Icon name="bookmark-filled" size={14} className="text-ice" title="Bookmarked" />}<Mark kind={s} size={16} /></span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!filtered.length && <p role="status" className="py-6 text-center text-fog">No matching topics. Clear the search or the bookmark filter.</p>}
            </div>
            <Perf />
          </section>
        )}

        {/* ------------------------------------------------------------ projects */}
        {tab === "projects" && (
          <section id="panel-projects" role="tabpanel" aria-labelledby="tab-projects" className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label="Projects">
            <Perf />
            <div className="flex flex-col gap-3 px-3 py-4 sm:px-4">
              <p className="max-w-prose text-sm text-fog">Every topic ends in a circuit you can run. Open one in the Lab, change it, and read the real Qiskit numbers.</p>
              <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {topics.map((n) => {
                  const s = topicStatus(state, n);
                  const planet = n.source.kind === "planet" ? PLANETS.find((pl) => pl.id === n.source.id) : undefined;
                  const mod = n.source.kind === "module" ? moduleById(n.source.id) : undefined;
                  const circuit = mod?.circuit ?? (planet ? EXPLORER_CIRCUITS[planet.id] : undefined);
                  return (
                    <li key={n.id} className="frame flex flex-col gap-2 p-3">
                      <div className="flex items-center gap-2">
                        <span className="code text-xs text-fog">{topicCode(n.id)}</span>
                        <h3 className="display min-w-0 flex-1 truncate text-lg">{n.title}</h3>
                        <Mark kind={s} size={16} />
                      </div>
                      <p className="code text-xs text-fog">{circuit ? `${circuit.qubits} wires · ${circuit.ops.length} gates` : "A game, not a circuit"}</p>
                      <p className="text-sm leading-relaxed">{n.challenge}</p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        {circuit && <Link href={n.lab ?? `/lab?module=${n.id}`} className="keycap"><Icon name="lab" size={14} /> Open in Lab</Link>}
                        <Link href={n.lesson} className="keycap" onClick={() => save(n.id, () => ({ started: true }))}><Icon name={planet ? "rocket" : "learn"} size={14} /> {planet ? "Play" : "Lesson"}</Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Link href="/community" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-ice hover:text-paper"><Icon name="community" size={16} /> Explore shared circuits</Link>
            </div>
            <Perf />
          </section>
        )}

        {/* ------------------------------------------------------------ tutor */}
        {tab === "tutor" && (
          <Window as="section" id="panel-tutor" role="tabpanel" aria-labelledby="tab-tutor" className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Tutor">
            <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
            <h2 className="display text-2xl sm:text-3xl">The tutor answers from your own run</h2>
            <p className="max-w-[68ch] leading-relaxed">
              The tutor reads the real Qiskit results of the circuit in front of you: counts, Bloch vectors, purity and transpiled depth. Open the Lab with the next topic&apos;s circuit, run it, and ask. Without an API key, an offline explainer built from the same results answers instead.
            </p>
            <div className="flex flex-wrap gap-2">
              {track.id === "explorer" ? (
                <Link href="/explorer" className="keycap-paper-primary"><Icon name="rocket" size={14} /> Ask Qubit on the mission map</Link>
              ) : (
                <Link href={`/lab?module=${next?.id ?? topic.id}`} className="keycap-paper-primary"><Icon name="tutor" size={14} /> Open the Lab with {(next ?? topic).title}</Link>
              )}
              <Link href={topic.lesson} className="keycap-paper"><Icon name="learn" size={14} /> Tutor inside the lesson</Link>
            </div>
          </Window>
        )}
      </div>

      {/* ------------------------------------------------------------ drawer */}
      <aside
        id="topic-drawer"
        ref={drawerRef}
        aria-label="Selected topic"
        aria-hidden={!open}
        className={`${open ? "drawer-in" : "hidden"} fixed inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto border-t border-ice bg-paper lg:static lg:top-24 lg:z-auto lg:max-h-none lg:self-start lg:overflow-visible lg:border-0 lg:bg-transparent lg:sticky print:static print:block`}
      >
        <Window as="div" className="flex flex-col gap-4 p-4 sm:p-5">
          <Perf className="-mx-4 -mt-4 sm:-mx-5 sm:-mt-5" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="display text-2xl leading-tight sm:text-3xl">{topic.title}</h2>
              <p className="label-sm mt-1 flex flex-wrap items-center gap-x-2 text-[#46587a]">
                <span className="code">{topicCode(topic.id)}</span>
                <span style={{ color: "var(--navy-ink)" }}>{track.name}</span>
                <span>· {LABELS[status]}</span>
                {personal[topic.id]?.started && status !== "done" && <span>· learning</span>}
                {personal[topic.id]?.skipped && status !== "done" && <span>· skipped</span>}
              </p>
            </div>
            <button type="button" aria-label={personal[topic.id]?.bookmarked ? "Remove bookmark" : "Bookmark this topic"} aria-pressed={!!personal[topic.id]?.bookmarked} className="keycap-paper !min-w-11 !px-0 print:hidden" onClick={() => save(topic.id, (c) => ({ bookmarked: !c.bookmarked }))}>
              <Icon name={personal[topic.id]?.bookmarked ? "bookmark-filled" : "bookmark"} size={16} />
            </button>
            <button type="button" aria-label="Close topic" className="keycap-paper !min-w-11 !px-0 print:hidden" onClick={close}><Icon name="close" size={16} /></button>
          </div>

          <p className="leading-relaxed">{topic.summary}</p>

          <div>
            <h3 className="label-sm text-[#46587a]">Prerequisites</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {topic.requires.length ? topic.requires.map((id) => {
                const local = topics.find((n) => n.id === id);
                const prerequisite = moduleById(id);
                const isDone = local ? topicStatus(state, local) === "done" : !!state.modules[id];
                return local ? (
                  <button key={id} type="button" onClick={() => pick(id)} className="chip min-h-9 hover:bg-paper-2">{topicCode(id)} {local.title}{isDone && <Icon name="cross" size={11} title="completed" />}</button>
                ) : (
                  <Link key={id} href={`/roadmaps/${prerequisite?.track ?? "student"}?topic=${id}`} className="chip min-h-9 hover:bg-paper-2">{topicCode(id)} {prerequisite?.skill ?? id}{isDone && <Icon name="cross" size={11} title="completed" />} <Icon name="next" size={11} /></Link>
                );
              }) : <span className="text-sm text-[#46587a]">Start here: no prior topics required.</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <Link href={topic.lesson} className="keycap-paper-primary" onClick={() => save(topic.id, () => ({ started: true }))}>
              <Icon name="run" size={14} /> {status === "done" ? "Revisit lesson" : "Start lesson"}
            </Link>
            {topic.lab && <Link href={topic.lab} className="keycap-paper"><Icon name="lab" size={14} /> Open in Lab</Link>}
          </div>
          {status !== "done" && (
            <div className="flex flex-wrap gap-2 print:hidden" role="group" aria-label="Your progress on this topic">
              <button type="button" className={`keycap-paper ${personal[topic.id]?.started ? "bg-navy-ink text-ice" : ""}`} aria-pressed={!!personal[topic.id]?.started} onClick={() => save(topic.id, (c) => ({ started: !c.started, skipped: c.started ? c.skipped : false }))}>
                <Icon name="flag" size={14} /> Learning
              </button>
              <button type="button" className={`keycap-paper ${personal[topic.id]?.skipped ? "bg-navy-ink text-ice" : ""}`} aria-pressed={!!personal[topic.id]?.skipped} onClick={() => save(topic.id, (c) => ({ skipped: !c.skipped, started: c.skipped ? c.started : false }))}>
                <Icon name="skip" size={14} /> Skipped
              </button>
            </div>
          )}

          <div className="border-t border-paper-3 pt-4">
            <h3 className="display text-lg">Watch &amp; read</h3>
            <p className="mt-1 text-xs text-[#46587a]">Free resources. Overview videos and full courses may cover several topics; Explorer reading is for guided learning with a grown-up.</p>
            <ul className="mt-3 flex flex-col gap-2">
              {topic.resources.map((r) => (
                <li key={r.url} className="border border-paper-3 p-3">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 font-medium underline decoration-paper-3 underline-offset-4 hover:decoration-navy-ink">
                    <Icon name={r.kind === "Video" ? "video" : "book"} size={16} className="mt-0.5 shrink-0" />
                    <span>{r.title}<span className="sr-only"> (opens in a new tab)</span></span>
                  </a>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#46587a]"><span className="chip">{r.kind}</span>{r.provider} · {r.level}</p>
                  <label className="mt-2 flex min-h-9 items-center gap-2 text-xs print:hidden">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--navy-ink)]" checked={!!personal[topic.id]?.reviewed?.includes(r.url)} onChange={(e) => save(topic.id, (c) => ({ reviewed: e.target.checked ? [...(c.reviewed ?? []).filter((u) => u !== r.url), r.url] : c.reviewed?.filter((u) => u !== r.url) }))} />
                    I reviewed this resource<span className="sr-only">: {r.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-navy-ink p-3">
            <h3 className="display text-lg">Try a challenge</h3>
            <p className="mt-1 text-sm leading-relaxed">{topic.challenge}</p>
          </div>

          <label className="block print:hidden">
            <span className="display text-lg">Personal notes</span>
            <textarea value={personal[topic.id]?.note ?? ""} onChange={(e) => save(topic.id, () => ({ note: e.target.value.slice(0, 4000) }))} rows={4} maxLength={4000} placeholder="What did you discover? What do you want to try next?" className="field mt-2 text-sm" />
          </label>
          <p className="text-xs text-[#46587a]">Reviewing resources, Learning and Skipped are your own marks. Completion is verified by the lesson or game and is what the roadmap and certificate count.</p>
        </Window>
      </aside>
    </div>
  );
}
