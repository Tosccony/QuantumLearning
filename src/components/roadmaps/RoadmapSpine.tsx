import { useEffect, useRef, type KeyboardEvent, type MutableRefObject, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";
import { Flag, Mark } from "@/components/ui/primitives";
import { EXPLORER_CIRCUITS, moduleById, modulesOf, type Track, type TrackId } from "@/lib/curriculum";
import { PLANETS } from "@/lib/levels";
import type { Personal, RoadmapTopic } from "@/lib/roadmaps";
import type { SkillStatus } from "@/lib/skills";

// Pure presentation shared by the web app and the Qollab player: no storage, no next/*, no progress.
// Without `status` and `personal` the spine shows topics only, which is what Qollab passes.

export const LABELS = { done: "Completed", available: "Ready to learn", locked: "Prerequisites remaining" } as const;
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

export type NodeRefs = MutableRefObject<Record<string, HTMLButtonElement | null>>;

/** Arrow keys, Home and End walk the spine; Enter or Space is the button's own click. */
export function spineKey(e: KeyboardEvent, i: number, ids: string[], refs: NodeRefs) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
  e.preventDefault();
  const j = e.key === "Home" ? 0 : e.key === "End" ? ids.length - 1 : Math.min(ids.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
  refs.current[ids[j]]?.focus();
}

/** Calls `onClose` on Escape while `active`. */
export function useEscape(active: boolean, onClose: () => void) {
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") latest.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

export function RoadmapLegend({ status, personal }: { status?: boolean; personal?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fog print:hidden" aria-label="Legend">
      <span className="label-sm">Marks</span>
      {status && (
        <>
          <span className="flex items-center gap-1.5"><Mark kind="done" size={14} /> completed, verified by the lesson</span>
          <span className="flex items-center gap-1.5"><Mark kind="available" size={14} /> ready</span>
          <span className="flex items-center gap-1.5"><Mark kind="locked" size={14} /> prerequisites remaining</span>
        </>
      )}
      <span className="flex items-center gap-1.5"><Flag width={11} /> selected</span>
      {personal && (
        <>
          <span className="flex items-center gap-1.5"><Icon name="bookmark-filled" size={13} className="text-ice" /> bookmarked</span>
          <span className="flex items-center gap-1.5"><Icon name="flag" size={13} className="text-ice" /> learning</span>
          <span className="flex items-center gap-1.5"><span className="line-through decoration-2">title</span> skipped</span>
        </>
      )}
    </div>
  );
}

/** Renders a lesson or Lab entry as a link (web) or a button (Qollab). */
export type Entry = (n: RoadmapTopic, className: string, children: ReactNode, label?: string) => ReactNode;

type SpineProps = {
  track: Track;
  topics: RoadmapTopic[];
  filtered: RoadmapTopic[];
  selected: string;
  open: boolean;
  zoom?: number;
  nodeRefs: NodeRefs;
  onPick: (id: string) => void;
  lessonEntry: Entry;
  labEntry: Entry;
  status?: (n: RoadmapTopic) => SkillStatus;
  personal?: Personal;
  /** The destination row after the last topic, shown when no search is active. */
  end?: ReactNode;
  complete?: boolean;
};

/** The connected map: topic frames on a spine with lesson, circuit and resource branches, connectors and milestone notes. */
export function RoadmapSpine({ track, topics, filtered, selected, open, zoom = 1, nodeRefs, onPick, lessonEntry, labEntry, status, personal, end, complete }: SpineProps) {
  const selIdx = filtered.findIndex((n) => n.id === selected);
  // With the drawer open the branch columns are narrow: the icon carries the label and the word stays for screen readers.
  const branchLabel = open ? "sr-only 2xl:not-sr-only" : "";
  const ids = filtered.map((n) => n.id);
  return (
    <ol className="roadmap-map mx-auto flex w-full max-w-[1100px] flex-col" style={{ zoom }} aria-label={`${track.name} topics in order`}>
      {filtered.map((n, i) => {
        const s = status?.(n);
        const p = personal?.[n.id] ?? {};
        const isSel = n.id === selected;
        const nextTopic = filtered[i + 1];
        const linked = !!nextTopic && nextTopic.requires.includes(n.id);
        // The path travelled lights up: every connector above the pressed node, plus completed links.
        const lit = i < selIdx || (s === "done" && !!nextTopic && status?.(nextTopic) !== "locked");
        const cross = n.requires.filter((r) => !topics.some((t) => t.id === r));
        const planet = n.source.kind === "planet" ? PLANETS.find((pl) => pl.id === n.source.id) : undefined;
        const mod = n.source.kind === "module" ? moduleById(n.source.id) : undefined;
        const circuit = mod?.circuit ?? (planet ? EXPLORER_CIRCUITS[planet.id] : undefined);
        const lessonBranch = lessonEntry(
          n,
          "frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-xs text-paper hover:border-[var(--line-strong)]",
          <>
            <Icon name={planet ? "rocket" : "learn"} size={14} className="shrink-0 text-ice" />
            <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>{planet ? "Game" : "Lesson"}</span>
            <span className="min-w-0 truncate">{planet ? planet.name : mod?.title}</span>
          </>,
        );
        const circuitBranch = circuit ? labEntry(
          n,
          "frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-xs text-paper hover:border-[var(--line-strong)]",
          <>
            <Icon name="chip" size={14} className="shrink-0 text-ice" />
            <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>Circuit</span>
            <span className="code min-w-0 truncate">{circuit.qubits}Q · {circuit.ops.length} gates</span>
          </>,
        ) : null;
        const resourcesBranch = (
          <button type="button" onClick={() => onPick(n.id)} className="frame flex min-h-11 max-w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-xs text-paper hover:border-[var(--line-strong)]" aria-label={`${n.resources.length} resources for ${n.title}: open the topic`}>
            <Icon name="video" size={14} className="shrink-0 text-ice" />
            <span className={`label-sm shrink-0 text-fog ${branchLabel}`}>Watch &amp; read</span>
            <span className="min-w-0 truncate">{n.resources.length} free{personal ? ` · ${p.reviewed?.length ?? 0} reviewed` : ""}</span>
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
                onClick={() => onPick(n.id)}
                onKeyDown={(e) => spineKey(e, i, ids, nodeRefs)}
                aria-pressed={isSel}
                aria-expanded={isSel && open}
                aria-controls="topic-drawer"
                aria-label={`${topicCode(n.id)} ${n.title}${s ? `: ${LABELS[s]}` : ""}${p.started && s !== "done" ? ", learning" : ""}${p.skipped && s !== "done" ? ", skipped" : ""}${p.bookmarked ? ", bookmarked" : ""}`}
                className={`frame relative flex min-h-[64px] w-full items-center gap-3 px-3 py-3 text-left transition-colors ${isSel ? "frame-active" : "hover:border-[var(--line-strong)]"} ${s === "locked" ? "punched text-fog" : "text-paper"}`}
              >
                {isSel && <Flag className="absolute -top-[11px] right-3" width={16} />}
                <span className="code w-8 shrink-0 text-xs text-fog">{topicCode(n.id)}</span>
                <span className="min-w-0 flex-1">
                  <span className={`display block text-lg leading-tight ${p.skipped && s !== "done" ? "line-through decoration-2" : ""}`}>{n.title}</span>
                  <span className="label-sm mt-0.5 flex flex-wrap gap-x-3 text-fog">
                    {s && <span>{LABELS[s]}</span>}
                    {p.started && s !== "done" && <span className="flex items-center gap-1 text-ice"><Icon name="flag" size={11} /> learning</span>}
                    {n.minutes ? <span>{n.minutes} min</span> : null}
                    {cross.map((r) => <span key={r} className="code normal-case tracking-normal">needs {topicCode(r)}</span>)}
                  </span>
                </span>
                {p.bookmarked && <Icon name="bookmark-filled" size={14} className="shrink-0 text-ice" title="Bookmarked" />}
                {s && <Mark kind={s} className="shrink-0" />}
              </button>
              <span className="hidden h-px bg-[var(--line-strong)] lg:block" aria-hidden />
              <div className="hidden min-w-0 lg:flex">{rightBranches}</div>
              <div className="ml-6 grid grid-cols-3 gap-2 lg:hidden">
                {lessonEntry(
                  n,
                  "frame flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper",
                  <>
                    <Icon name={planet ? "rocket" : "learn"} size={13} className="shrink-0 text-ice" /> {planet ? "Play" : "Lesson"}
                  </>,
                  `${planet ? "Play" : "Lesson"}: ${planet ? planet.name : mod?.title}`,
                )}
                {circuit ? labEntry(
                  n,
                  "frame code flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper",
                  <>
                    <Icon name="chip" size={13} className="shrink-0 text-ice" /> {circuit.qubits}Q · {circuit.ops.length}
                  </>,
                  `Open the ${circuit.qubits}-qubit circuit in the Lab`,
                ) : <span className="frame frame-ghost flex min-h-10 items-center justify-center text-[0.72rem] text-fog" aria-hidden>game</span>}
                <button type="button" onClick={() => onPick(n.id)} className="frame flex min-h-10 items-center justify-center gap-1.5 px-2 text-[0.72rem] text-paper" aria-label={`${n.resources.length} resources for ${n.title}: open the topic`}>
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
      {end && filtered.length === topics.length && (
        <li className="flex flex-col items-center">
          <span className={`block h-8 w-0 border-l-2 ${complete ? "border-ice" : "border-[var(--line-strong)]"}`} aria-hidden />
          {end}
        </li>
      )}
    </ol>
  );
}
