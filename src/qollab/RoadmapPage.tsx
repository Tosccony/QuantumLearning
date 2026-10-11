import { useMemo, useRef, useState } from "react";
import { RoadmapLegend, RoadmapSpine, topicCode, useEscape, type Entry, type NodeRefs } from "@/components/roadmaps/RoadmapSpine";
import Icon from "@/components/ui/Icon";
import { Heading, Perf, Stripe, Window } from "@/components/ui/primitives";
import { moduleById, type Track } from "@/lib/curriculum";
import type { Circuit } from "@/lib/quantum";
import { roadmapTopics, type RoadmapTopic } from "@/lib/roadmaps";

/** A read-only roadmap: the shared spine and a topic drawer. Notes, bookmarks and progress live in the web app. */
export default function RoadmapPage({ track, onOpenLesson, onOpenLab, onBack }: { track: Track; onOpenLesson: (id: string) => void; onOpenLab: (c: Circuit) => void; onBack: () => void }) {
  const topics = roadmapTopics(track.id);
  const [selected, setSelected] = useState(topics[0].id);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nodeRefs: NodeRefs = useRef({});
  const topic = topics.find((n) => n.id === selected)!;
  const filtered = useMemo(() => topics.filter((n) => `${n.title} ${n.summary}`.toLowerCase().includes(query.toLowerCase().trim())), [topics, query]);
  const mins = topics.reduce((a, n) => a + (n.minutes ?? 0), 0);
  const lessonId = topic.source.kind === "module" ? topic.source.id : null;
  const lab = lessonId ? moduleById(lessonId)?.circuit : undefined;
  const pick = (id: string) => { setSelected(id); setOpen(true); };
  const close = () => { setOpen(false); nodeRefs.current[selected]?.focus(); };
  useEscape(open, close);

  const moduleOf = (n: RoadmapTopic) => (n.source.kind === "module" ? n.source.id : null);
  const lessonEntry: Entry = (n, className, children, label) => (
    <button type="button" className={className} aria-label={label} onClick={() => { const id = moduleOf(n); if (id) onOpenLesson(id); }}>{children}</button>
  );
  const labEntry: Entry = (n, className, children, label) => (
    <button type="button" className={className} aria-label={label} onClick={() => { const id = moduleOf(n); const c = id && moduleById(id)?.circuit; if (c) onOpenLab(c); }}>{children}</button>
  );

  return (
    <div className={`roadmap flex flex-col gap-5 ${open ? "lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6" : ""}`}>
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-col gap-3">
          <button type="button" onClick={onBack} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} /> All roadmaps
          </button>
          <div className="frame">
            <Stripe track={track.id} />
            <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
                <Icon name={track.id} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <Heading as="h1" code={`${topics.length} TOPICS${mins ? ` · ${mins} MIN` : ""}`}>{track.name} roadmap</Heading>
                <p className="text-sm text-fog">{track.audience} · {track.tagline}</p>
              </div>
            </div>
          </div>
          <label>
            <span className="sr-only">Search topics</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics…" className="field" />
          </label>
        </header>

        <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label="Learning path">
          <Perf />
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
            <RoadmapLegend />
            <RoadmapSpine track={track} topics={topics} filtered={filtered} selected={selected} open={open} nodeRefs={nodeRefs} onPick={pick} lessonEntry={lessonEntry} labEntry={labEntry} />
            {!filtered.length && <p role="status" className="py-6 text-center text-fog">No matching topics. Clear the search.</p>}
          </div>
          <Perf />
        </section>
      </div>

      <aside
        id="topic-drawer"
        aria-label="Selected topic"
        aria-hidden={!open}
        className={`${open ? "drawer-in" : "hidden"} fixed inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto border-t border-ice bg-paper lg:static lg:top-24 lg:z-auto lg:max-h-none lg:self-start lg:overflow-visible lg:border-0 lg:bg-transparent lg:sticky`}
      >
        <Window as="div" className="flex flex-col gap-4 p-4 sm:p-5">
          <Perf className="-mx-4 -mt-4 sm:-mx-5 sm:-mt-5" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="display text-2xl leading-tight sm:text-3xl">{topic.title}</h2>
              <p className="label-sm mt-1 flex flex-wrap items-center gap-x-2 text-[#46587a]">
                <span className="code">{topicCode(topic.id)}</span>
                <span style={{ color: "var(--navy-ink)" }}>{track.name}</span>
              </p>
            </div>
            <button type="button" aria-label="Close topic" className="keycap-paper !min-w-11 !px-0" onClick={close}><Icon name="close" size={16} /></button>
          </div>

          <p className="leading-relaxed">{topic.summary}</p>

          <div>
            <h3 className="label-sm text-[#46587a]">Prerequisites</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {topic.requires.length ? topic.requires.map((id) => {
                const local = topics.find((n) => n.id === id);
                const prerequisite = moduleById(id);
                return local ? (
                  <button key={id} type="button" onClick={() => pick(id)} className="chip min-h-9 hover:bg-paper-2">{topicCode(id)} {local.title}</button>
                ) : prerequisite ? (
                  <button key={id} type="button" onClick={() => onOpenLesson(id)} className="chip min-h-9 hover:bg-paper-2">{topicCode(id)} {prerequisite.skill} <Icon name="next" size={11} /></button>
                ) : null;
              }) : <span className="text-sm text-[#46587a]">Start here: no prior topics required.</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {lessonId && (
              <button type="button" className="keycap-paper-primary" onClick={() => onOpenLesson(lessonId)}>
                <Icon name="run" size={14} /> Start lesson →
              </button>
            )}
            {lab && <button type="button" className="keycap-paper" onClick={() => onOpenLab(lab)}><Icon name="lab" size={14} /> Open in Lab</button>}
          </div>

          <div className="border-t border-paper-3 pt-4">
            <h3 className="display text-lg">Watch &amp; read</h3>
            <p className="mt-1 text-xs text-[#46587a]">Free resources. Overview videos and full courses may cover several topics.</p>
            <ul className="mt-3 flex flex-col gap-2">
              {topic.resources.map((r) => (
                <li key={r.url} className="border border-paper-3 p-3">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 font-medium underline decoration-paper-3 underline-offset-4 hover:decoration-navy-ink">
                    <Icon name={r.kind === "Video" ? "video" : "book"} size={16} className="mt-0.5 shrink-0" />
                    <span>{r.title}<span className="sr-only"> (opens in a new tab)</span></span>
                  </a>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#46587a]"><span className="chip">{r.kind}</span>{r.provider} · {r.level}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-navy-ink p-3">
            <h3 className="display text-lg">Try a challenge</h3>
            <p className="mt-1 text-sm leading-relaxed">{topic.challenge}</p>
          </div>
          <p className="text-xs text-[#46587a]">Progress and notes are saved only in the web app.</p>
        </Window>
      </aside>
    </div>
  );
}
