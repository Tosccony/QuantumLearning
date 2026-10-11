"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { EdgeCode, Heading, Mark, Perf, Stripe, Window } from "@/components/ui/primitives";
import { moduleById, modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { certificate, moduleStatus, trackProgress } from "@/lib/skills";

const LOOP: { icon: IconName; label: string; text: string }[] = [
  { icon: "learn", label: "Learn", text: "the idea" },
  { icon: "chip", label: "Build", text: "the circuit" },
  { icon: "run", label: "Run", text: "it on Qiskit" },
  { icon: "tutor", label: "Understand", text: "it with the tutor" },
  { icon: "share", label: "Share", text: "your variation" },
];

/** Progress as frame cells inside a window: done cells are crossed out in navy ink. */
function Cells({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${label}: ${done} of ${total} complete`}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < done;
        return (
          <span key={i} className={`flex h-4 flex-1 items-center justify-center border ${isDone ? "border-navy-ink bg-navy-ink text-ice" : "border-paper-3"}`} aria-hidden>
            {isDone && <Icon name="cross" size={10} />}
          </span>
        );
      })}
    </div>
  );
}

/** A track is a strip of module frames stacked on the rail, each frame a full row. */
export default function TrackPage() {
  const { track } = useParams<{ track: string }>();
  const t = TRACKS.find((x) => x.id === track && x.id !== "explorer");
  const { state, ready } = useProgress();
  if (!t) notFound();
  if (!ready) return null;

  const mods = modulesOf(t.id as TrackId);
  const p = trackProgress(state, t.id);
  const cert = certificate(state, t.id);
  const mins = mods.reduce((a, m) => a + m.minutes, 0);
  const resume = mods.find((m) => moduleStatus(state, m) === "available") ?? mods[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-col gap-3">
          <Link href="/learn" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} /> All tracks
          </Link>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
              <Icon name={t.id} size={26} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <Heading as="h1" code={`${mods.length} MODULES · ${mins} MIN`}>{t.name} track</Heading>
              <p className="text-sm text-fog">{t.audience}</p>
            </div>
          </div>
          <p className="max-w-prose text-fog">{t.tagline}</p>
        </header>

        <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label={`${t.name} modules`}>
          <Perf />
          <ol className="flex flex-col gap-2 px-3 py-3 sm:px-4 lg:px-3">
            {mods.map((m, i) => {
              const st = moduleStatus(state, m);
              const code = `F${String(i + 1).padStart(2, "0")}`;
              return (
                <li key={m.id} className={`frame ${st === "locked" ? "punched" : ""}`}>
                  <Stripe track={t.id} />
                  <Link
                    href={`/learn/${m.id}`}
                    className={`flex min-h-11 flex-col gap-3 p-4 hover:bg-navy sm:flex-row sm:items-start sm:gap-5 ${st === "locked" ? "text-fog" : "text-paper"}`}
                    aria-label={`${code} ${m.title}, ${m.minutes} minutes, ${st === "done" ? "completed" : st}`}
                  >
                    <div className="flex items-center gap-3 sm:w-14 sm:flex-col sm:items-start sm:gap-2">
                      <EdgeCode className="!text-paper">{code}</EdgeCode>
                      <Mark kind={st} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="display text-xl sm:text-2xl">{m.title}</h2>
                        <span className="code shrink-0 text-xs text-fog">{m.minutes} min</span>
                      </div>
                      <p className="mt-1 text-sm text-fog">{m.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="chip"><Icon name="badge" size={12} /> {m.skill}</span>
                        <span className="chip"><Icon name="qubit" size={12} /> {m.circuit.qubits}-qubit circuit</span>
                        {st === "locked" && (
                          <span className="flex items-center gap-1.5 text-xs text-fog">
                            <Icon name="lock" size={12} /> Recommended after {m.requires.map((r) => moduleById(r)?.title ?? r.toUpperCase()).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Perf />
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Window as="section" className="flex flex-col gap-4 p-5" aria-label="Your progress">
          <Perf className="-mx-5 -mt-5" />
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="label-sm text-[#46587a]">Your progress</p>
              <p className="display num text-4xl leading-none">{p.done}<span className="text-[#46587a]">/{p.total}</span></p>
            </div>
            <dl className="text-right">
              <dt className="label-sm text-[#46587a]">Running time</dt>
              <dd className="code text-sm">{mins} min</dd>
            </dl>
          </div>
          <Cells done={p.done} total={p.total} label={`${t.name} track progress`} />
          <p className="flex items-start gap-2 text-sm text-[#46587a]">
            <Icon name="badge" size={16} className="mt-0.5 shrink-0" />
            <span>Complete every module to earn the <b className="text-navy-ink">{t.certificate}</b> certificate.</span>
          </p>
          {cert ? (
            <Link href={`/certificate/${t.id}`} className="keycap-paper-primary w-full">
              <Icon name="badge" size={16} /> View certificate
            </Link>
          ) : (
            <Link href={`/learn/${resume.id}`} className="keycap-paper-primary w-full">
              {p.done ? "Continue" : "Start the track"} <Icon name="next" size={16} />
            </Link>
          )}
        </Window>

        <section className="frame p-4" aria-label="How a module works">
          <p className="label-sm mb-3 text-fog">Every module follows the same loop</p>
          <ol className="flex flex-col gap-1">
            {LOOP.map((s, i) => (
              <li key={s.label} className="frame flex min-h-11 items-center gap-3 px-3 py-2">
                <EdgeCode>{String(i + 1).padStart(2, "0")}</EdgeCode>
                <Icon name={s.icon} size={16} className="shrink-0 text-ice" />
                <span className="text-sm"><span className="label">{s.label}</span> <span className="text-fog">{s.text}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
