"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Flag, Heading, Notice, Perf } from "@/components/ui/primitives";
import { listProjects, type Project } from "@/lib/community";
import { useProgress } from "@/lib/progress";

const SORTS: { key: "stars" | "new"; label: string }[] = [
  { key: "stars", label: "Most starred" },
  { key: "new", label: "Newest" },
];

/** Community: a grid of project frames on the rail, each with its measured counts as ice bars. */
export default function Community() {
  const { state } = useProgress();
  const [sort, setSort] = useState<"stars" | "new">("stars");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchId = useId();

  useEffect(() => {
    const t = setTimeout(() => {
      listProjects(sort, q).then((p) => { setItems(p); setError(null); }).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [sort, q]);

  const onSortKey = (e: React.KeyboardEvent) => {
    const i = SORTS.findIndex((s) => s.key === sort);
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? SORTS[(i + 1) % SORTS.length] : e.key === "ArrowLeft" || e.key === "ArrowUp" ? SORTS[(i + SORTS.length - 1) % SORTS.length] : null;
    if (next) {
      e.preventDefault();
      setSort(next.key);
      (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-sort="${next.key}"]`)?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end gap-4">
        <div className="mr-auto flex max-w-prose flex-col gap-2">
          <Heading as="h1">Community circuits</Heading>
          <p className="text-fog">Every project was re-run on the Qiskit Aer simulator when it was published. Star the ones you like, or fork them into your Lab.</p>
        </div>
        <Link href="/lab" className="keycap-primary">
          <Icon name="plus" size={14} /> New circuit
        </Link>
      </header>

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor={searchId} className="sr-only">Search projects</label>
          <input id={searchId} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search circuits, tags…" type="search" className="field" />
        </div>
        <div className="flex" role="radiogroup" aria-label="Sort" onKeyDown={onSortKey}>
          {SORTS.map((s) => {
            const on = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                data-sort={s.key}
                onClick={() => setSort(s.key)}
                className={`frame relative -ml-px flex min-h-11 items-center gap-2 px-4 label ${on ? "frame-active text-paper" : "text-fog hover:text-paper"}`}
              >
                {on && <Flag className="absolute -top-[11px] left-2" width={14} />}
                <Icon name={s.key === "stars" ? "star" : "clock"} size={14} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <Notice tone="bad" role="alert">{error}</Notice>}
      {!items && !error && <Notice tone="info" role="status"><span className="blink">Loading community circuits…</span></Notice>}
      {items?.length === 0 && (
        <Notice tone="info" role="status">
          No circuits match. <Link href="/lab" className="underline underline-offset-2">Build one in the Lab</Link> and publish it.
        </Notice>
      )}

      {items && items.length > 0 && (
        <section className="rail -mx-3 sm:-mx-4 lg:-mx-6" aria-label="Projects">
          <Perf />
          <ul className="grid gap-2 px-3 py-3 sm:grid-cols-2 sm:px-4 lg:grid-cols-3 lg:px-6">
            {items.map((p, i) => {
              const starred = state.starred.includes(p.id);
              const mine = state.projects.includes(p.id);
              return (
                <li key={p.id} className="frame flex">
                  <Link href={`/community/${p.id}`} className="flex min-h-11 w-full flex-col gap-3 p-4 text-paper hover:bg-navy" aria-label={`${p.title} by ${p.author}`}>
                    <div className="flex items-center justify-between gap-2">
                      <EdgeCode>P{String(i + 1).padStart(2, "0")}</EdgeCode>
                      <span className="code text-xs text-fog">{p.circuit.qubits}q · {p.circuit.ops.length} gates · {p.shots.toLocaleString()} shots</span>
                    </div>
                    <MiniHistogram counts={p.counts} />
                    <div className="min-w-0">
                      <h2 className="display text-xl leading-tight">{p.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-fog">{p.description}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5">
                      {p.tags.slice(0, 3).map((t) => <span key={t} className="chip">#{t}</span>)}
                    </div>
                    <div className="flex items-center gap-4 border-t border-[var(--line)] pt-3 text-xs text-fog">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Icon name="user" size={13} className="shrink-0" />
                        <span className="truncate">{p.author}{mine ? " (you)" : ""}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-1.5 code" aria-label={`${p.stars} stars${starred ? ", starred by you" : ""}`}>
                        <Icon name={starred ? "star-filled" : "star"} size={13} className={starred ? "text-ice" : ""} /> {p.stars}
                      </span>
                      <span className="flex items-center gap-1.5 code" aria-label={`${p.forks} forks`}>
                        <Icon name="fork" size={13} /> {p.forks}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Perf />
        </section>
      )}
    </div>
  );
}

/** Measured counts as square ice bars on a navy-ink graticule, decorative only. */
function MiniHistogram({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 16);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="graticule-navy flex h-16 items-end gap-px border border-[var(--line)] bg-navy-ink p-1.5" aria-hidden>
      {entries.map(([k, v]) => (
        <div key={k} className="flex-1 bg-ice" style={{ height: `${Math.max((v / max) * 82, 3)}%` }} title={`${k}: ${v}`} />
      ))}
    </div>
  );
}
