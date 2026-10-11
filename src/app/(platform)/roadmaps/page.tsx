"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Mark, Perf, Stripe } from "@/components/ui/primitives";
import { topicCode } from "@/components/roadmaps/RoadmapView";
import { TRACKS } from "@/lib/curriculum";
import { roadmapTopics, topicStatus } from "@/lib/roadmaps";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

const HOW = [
  { icon: "map", title: "Follow the path", text: "Topics run down a spine in the order they build on each other; the marks show what is done, ready or locked." },
  { icon: "learn", title: "Learn your way", text: "Each topic is one of our lessons or games, with free videos and reading beside it and room for your own notes." },
  { icon: "lab", title: "Put it into practice", text: "Run the topic's circuit on Qiskit, pass the check question, and the roadmap and your certificate move on their own." },
] as const;

/** The roadmaps catalogue: one frame per track, each with the first topics of its spine. */
export default function RoadmapsPage() {
  const [query, setQuery] = useState("");
  const { state, ready } = useProgress();
  const q = query.toLowerCase().trim();
  const total = TRACKS.reduce((a, t) => a + roadmapTopics(t.id).length, 0);
  const tracks = TRACKS.filter((t) => `${t.name} ${t.audience} ${t.tagline} ${roadmapTopics(t.id).map((n) => n.title).join(" ")}`.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading as="h1" code={`${TRACKS.length} ROADMAPS · ${total} TOPICS`}>Roadmaps</Heading>
          <p className="max-w-prose text-fog">Five paths from curious explorer to researcher. Every topic is one of our lessons or games, with free videos and reading beside it. Press a topic to see what it needs and where it leads.</p>
        </div>
        <label className="w-full sm:max-w-xs">
          <span className="sr-only">Find a roadmap or topic</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a topic" className="field" />
        </label>
      </header>

      <section className="rail -mx-3 sm:-mx-4 lg:-mx-6" aria-label="Learning roadmaps">
        <Perf />
        {tracks.length ? (
          <ul className="grid gap-2 px-3 py-3 sm:grid-cols-2 sm:px-4 lg:grid-cols-3 lg:px-6 xl:grid-cols-5">
            {tracks.map((t) => {
              const topics = roadmapTopics(t.id);
              const p = ready ? trackProgress(state, t.id) : { done: 0, total: topics.length };
              const preview = topics.slice(0, 4);
              return (
                <li key={t.id} className="frame flex flex-col">
                  <Stripe track={t.id} />
                  <Link href={`/roadmaps/${t.id}`} className="flex h-full flex-col gap-3 p-4 text-paper hover:bg-navy" aria-label={`${t.name} roadmap: ${topics.length} topics, ${p.done} completed`}>
                    <div className="flex items-center gap-2">
                      <Icon name={t.id} size={22} className="text-ice" />
                      <h2 className="display text-2xl">{t.name}</h2>
                      <EdgeCode className="ml-auto">{t.id.slice(0, 3)}</EdgeCode>
                    </div>
                    <p className="label-sm text-fog">{t.audience}</p>
                    <ol className="flex flex-col" aria-label={`First topics of the ${t.name} roadmap`}>
                      {preview.map((n, i) => (
                        <li key={n.id} className="flex flex-col">
                          <span className="flex items-center gap-2 border border-[var(--line)] px-2 py-1.5 text-xs">
                            <span className="code text-fog">{topicCode(n.id)}</span>
                            <span className="min-w-0 flex-1 truncate">{n.title}</span>
                            {ready && <Mark kind={topicStatus(state, n)} size={12} />}
                          </span>
                          {i < preview.length - 1 && <span className="ml-5 block h-3 w-0 border-l-2 border-[var(--line-strong)]" aria-hidden />}
                        </li>
                      ))}
                      {topics.length > preview.length && <li className="code mt-1 pl-5 text-[0.62rem] uppercase tracking-[0.12em] text-fog">+{topics.length - preview.length} more</li>}
                    </ol>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <span className="code text-xs text-fog">{ready ? `${p.done}/${p.total} completed` : `${p.total} topics`}</span>
                      <span className="label-sm flex items-center gap-1 text-ice">{ready && p.done ? "Continue" : "Explore path"} <Icon name="next" size={12} /></span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status" className="px-4 py-6 text-center text-fog">No roadmaps match “{query}”. Try a broader topic or clear the search.</p>
        )}
        <Perf />
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-3">
        <h2 id="how-title" className="display text-2xl sm:text-3xl">How a roadmap works</h2>
        <ol className="frame flex flex-col divide-y divide-[var(--line)]">
          {HOW.map((h) => (
            <li key={h.title} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="flex shrink-0 items-center gap-2 sm:w-56"><Icon name={h.icon} size={16} className="text-ice" /><span className="display text-lg">{h.title}</span></span>
              <span className="text-sm leading-relaxed text-fog">{h.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-fog">
          Lesson progress, bookmarks and notes are saved on this device. <Link className="text-ice hover:text-paper" href="/progress">See XP, streaks and certificates</Link>.
        </p>
      </section>
    </div>
  );
}
