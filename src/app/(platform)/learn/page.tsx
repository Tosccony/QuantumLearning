"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Perf, Stripe } from "@/components/ui/primitives";
import { modulesOf, TRACKS } from "@/lib/curriculum";
import { PLANETS } from "@/lib/levels";
import { useProgress } from "@/lib/progress";
import { trackProgress } from "@/lib/skills";

/** Progress as frame cells: one square per module or planet, done ones crossed out in ice. */
function Cells({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${label}: ${done} of ${total} complete`}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < done;
        return (
          <span key={i} className={`flex h-4 flex-1 items-center justify-center border ${isDone ? "border-ice bg-ice text-navy-ink" : "border-[var(--line-strong)]"}`} aria-hidden>
            {isDone && <Icon name="cross" size={10} />}
          </span>
        );
      })}
    </div>
  );
}

/** The catalogue is one strip: five large frames on a perforated rail, one per track. */
export default function LearnCatalog() {
  const { state, ready } = useProgress();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading as="h1">Choose your track</Heading>
          <p className="max-w-prose text-fog">Four paths from first steps to research, plus Concepts deep dives. Every lesson ends with a real circuit you run on the Qiskit Aer simulator.</p>
        </div>
        <Link href="/roadmaps" className="keycap w-fit"><Icon name="map" size={14} /> Interactive roadmaps</Link>
      </header>

      <section className="rail -mx-3 sm:-mx-4 lg:-mx-6" aria-label="Tracks">
        <Perf />
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-3 sm:px-4 lg:px-6 [scrollbar-width:thin] xl:grid xl:grid-cols-5 xl:overflow-visible">
          {TRACKS.map((t, i) => {
            const total = t.id === "explorer" ? PLANETS.length : modulesOf(t.id).length;
            const p = ready ? trackProgress(state, t.id) : { done: 0, total };
            const href = t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`;
            const mins = t.id === "explorer" ? 30 : modulesOf(t.id).reduce((a, m) => a + m.minutes, 0);
            const unit = t.id === "explorer" ? "planets" : "modules";
            return (
              <li key={t.id} className="frame flex min-w-[288px] flex-1 shrink-0 snap-start flex-col sm:min-w-[320px] xl:min-w-0">
                <Stripe track={t.id} />
                <Link href={href} className="flex min-h-11 flex-1 flex-col gap-4 p-4 text-paper hover:bg-navy sm:p-5" aria-label={`${t.name} track: ${t.audience}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
                      <Icon name={t.id} size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <EdgeCode>T{String(i + 1).padStart(2, "0")}</EdgeCode>
                        <span className="code text-xs text-fog">{p.total} {unit} · {mins} min</span>
                      </div>
                      <h2 className="display text-2xl sm:text-3xl">{t.name}</h2>
                      <p className="text-sm text-fog xl:min-h-10">{t.audience}</p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed">{t.tagline}</p>

                  <div className="mt-auto flex flex-col gap-2 border-t border-[var(--line)] pt-3">
                    <p className="flex items-center gap-2 text-xs text-fog xl:min-h-8">
                      <Icon name="badge" size={14} className="shrink-0" />
                      <span>Certificate: <span className="text-paper">{t.certificate}</span></span>
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Cells done={p.done} total={p.total} label={`${t.name} progress`} />
                      </div>
                      <span className="code text-xs text-fog">{p.done}/{p.total}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <Perf />
      </section>
    </div>
  );
}
