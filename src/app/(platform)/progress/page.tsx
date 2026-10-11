"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";
import { EdgeCode, Heading, Mark, Perf, Stripe } from "@/components/ui/primitives";
import { modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { PLANETS, xpLevel, XP_PER_LEVEL } from "@/lib/levels";
import { useProgress, type State } from "@/lib/progress";
import { certificate, moduleStatus, trackProgress, type SkillStatus } from "@/lib/skills";

type Node = { id: string; track: TrackId; row: number; label: string; href: string; status: SkillStatus; requires: string[] };

// Cross-track links that show how the tracks build on each other.
const BRIDGES: [string, string][] = [["e7", "s1"], ["s4", "r1"], ["s6", "d4"], ["d5", "r4"], ["d6", "r5"], ["s2", "d1"]];

function nodes(s: State): Node[] {
  const out: Node[] = PLANETS.map((p, i) => ({
    id: `e${p.id}`, track: "explorer", row: i, label: p.concept, href: `/planet/${p.id}`,
    status: s.levels[p.id]?.completed ? "done" : i === 0 || s.levels[p.id - 1]?.completed ? "available" : "locked",
    requires: i ? [`e${p.id - 1}`] : [],
  }));
  for (const t of ["student", "developer", "researcher"] as const)
    modulesOf(t).forEach((m, i) => out.push({ id: m.id, track: t, row: i, label: m.skill, href: `/learn/${m.id}`, status: moduleStatus(s, m), requires: m.requires }));
  return out;
}

/** Rails are stacked in this order, top to bottom. */
const RAILS: TrackId[] = ["explorer", "student", "developer", "researcher"];

const STATUS_WORD: Record<SkillStatus, string> = { done: "completed", available: "available", locked: "locked" };

/** Edge code for a node: E01, S03, D06, R02. */
const edgeCode = (n: Node) => `${n.track[0].toUpperCase()}${String(n.row + 1).padStart(2, "0")}`;

type Splice = { from: string; to: string; lit: boolean; d: string };

export default function ProgressPage() {
  const { state, ready } = useProgress();
  if (!ready) return null;
  return <Progress state={state} />;
}

function Progress({ state }: { state: State }) {
  const ns = nodes(state);
  const byId = Object.fromEntries(ns.map((n) => [n.id, n]));
  const doneCount = ns.filter((n) => n.status === "done").length;
  const level = xpLevel(state.xp);
  const toNext = XP_PER_LEVEL - (state.xp % XP_PER_LEVEL);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Heading as="h1">Your progress</Heading>
        <p className="max-w-prose text-fog">
          {state.name ? `${state.name} · ` : ""}Skills unlock as you finish modules. Certificates arrive when you complete a track.
        </p>
      </header>

      {/* Telemetry: readouts in the rail idiom, one line. */}
      <section aria-label="Statistics" className="rail">
        <Perf />
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
          <Tele icon="xp" value={state.xp} unit="XP" note={`LV ${level} · ${toNext} to next`} />
          <Tele icon="streak" value={state.streak} unit="day streak" />
          <Tele icon="progress" value={`${doneCount}/${ns.length}`} unit="skills" />
          <Tele icon="lab" value={state.labRuns} unit="circuits run" note="Qiskit Aer" />
          <Tele icon="share" value={state.projects.length} unit="shared" note={`${state.starred.length} starred`} />
        </ul>
        <Perf />
      </section>

      <SkillRails ns={ns} byId={byId} />

      <section aria-labelledby="certs-heading" className="flex flex-col gap-3">
        <Heading><span id="certs-heading">Certificates</span></Heading>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((t, i) => {
            const c = certificate(state, t.id);
            const p = trackProgress(state, t.id);
            const unit = t.id === "explorer" ? "planets" : "modules";
            return (
              <li key={t.id} className={`frame flex flex-col ${c ? "frame-active" : ""}`}>
                <Stripe track={t.id} />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${c ? "border-ice text-ice" : "border-[var(--line-strong)] text-fog"}`} aria-hidden>
                      <Icon name={c ? "badge" : t.id} size={24} />
                    </span>
                    <EdgeCode>C{String(i + 1).padStart(2, "0")}</EdgeCode>
                  </div>
                  <div>
                    <h3 className="display text-xl">{t.certificate}</h3>
                    <p className="code mt-1 text-xs text-fog">
                      {t.name} track · {p.done}/{p.total} {unit}
                    </p>
                  </div>
                  <div className="flex gap-1" role="img" aria-label={`${t.name} track: ${p.done} of ${p.total} ${unit} complete`}>
                    {Array.from({ length: p.total }, (_, k) => (
                      <span key={k} className={`h-2 w-full border ${k < p.done ? "border-ice bg-ice" : "border-[var(--line-strong)]"}`} aria-hidden />
                    ))}
                  </div>
                  <p className="text-xs text-fog">{c ? "Earned. Issued from progress stored on this device." : `Complete every ${unit.slice(0, -1)} to earn it.`}</p>
                  <div className="mt-auto pt-1">
                    {c ? (
                      <Link href={`/certificate/${t.id}`} className="keycap-primary w-full" aria-label={`View and print the ${t.certificate} certificate`}>
                        <Icon name="print" size={16} />
                        View &amp; print
                      </Link>
                    ) : (
                      <Link href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className="keycap w-full" aria-label={`${p.done ? "Continue" : "Start"} the ${t.name} track`}>
                        {p.done ? "Continue" : "Start"}
                        <Icon name="next" size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** One readout cell in the stats strip. */
function Tele({ icon, value, unit, note }: { icon: IconName; value: React.ReactNode; unit: string; note?: string }) {
  return (
    <li className="flex items-center gap-2 code text-sm text-fog">
      <Icon name={icon} size={16} className="text-ice" />
      <span className="display num text-xl text-paper">{value}</span>
      <span className="label-sm">{unit}</span>
      {note && <span className="hidden text-xs sm:inline">· {note}</span>}
    </li>
  );
}

/**
 * The skill tree as four parallel rails. Nodes on a rail are sequential, so the rail itself
 * is the prerequisite link. Cross-track bridges are drawn as dashed ice splices in an overlay
 * once every rail fits without scrolling; otherwise they are listed as text.
 */
function SkillRails({ ns, byId }: { ns: Node[]; byId: Record<string, Node> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const rails = useRef<Map<TrackId, HTMLOListElement>>(new Map());
  const anchors = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [splices, setSplices] = useState<Splice[] | null>(null);
  // `ns`/`byId` are rebuilt every render; the effect keys on what actually changes (statuses)
  // and reads the latest lookup through a ref so it never loops with setSplices.
  const latest = useRef(byId);
  latest.current = byId;
  const statusKey = ns.map((n) => `${n.id}:${n.status}`).join(",");

  const setRail = useCallback((t: TrackId) => (el: HTMLOListElement | null) => { if (el) rails.current.set(t, el); else rails.current.delete(t); }, []);
  const setAnchor = useCallback((id: string) => (el: HTMLAnchorElement | null) => { if (el) anchors.current.set(id, el); else anchors.current.delete(id); }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const measure = () => {
      const wide = window.matchMedia("(min-width: 768px)").matches;
      const fits = [...rails.current.values()].every((r) => r.scrollWidth <= r.clientWidth + 1);
      if (!wide || !fits) return setSplices(null);
      const box = el.getBoundingClientRect();
      const out: Splice[] = [];
      for (const [from, to] of BRIDGES) {
        const a = anchors.current.get(from), b = anchors.current.get(to);
        if (!a || !b) continue;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const down = ra.top <= rb.top;
        const x1 = ra.left + ra.width / 2 - box.left, y1 = (down ? ra.bottom : ra.top) - box.top;
        const x2 = rb.left + rb.width / 2 - box.left, y2 = (down ? rb.top : rb.bottom) - box.top;
        const ym = Math.round((y1 + y2) / 2) + 0.5;
        out.push({ from, to, lit: latest.current[from]?.status === "done", d: `M${x1},${y1} V${ym} H${x2} V${y2}` });
      }
      setSplices(out);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    rails.current.forEach((r) => ro.observe(r));
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure).catch(() => {});
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [statusKey]);

  return (
    <section aria-labelledby="tree-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Heading><span id="tree-heading">Skill tree</span></Heading>
        <p className="max-w-prose text-sm text-fog">
          Each rail is one track, read left to right: a skill needs the one before it. Dashed ice splices show where one track feeds another.
        </p>
      </div>

      <div ref={wrap} className="relative flex flex-col gap-3">
        {RAILS.map((track) => {
          const t = TRACKS.find((x) => x.id === track)!;
          const row = ns.filter((n) => n.track === track);
          const done = row.filter((n) => n.status === "done").length;
          return (
            <div key={track} className="rail" aria-label={`${t.name} rail`}>
              <Stripe track={track} />
              <Perf />
              <div className="flex items-stretch">
                <div className="flex w-28 shrink-0 flex-col justify-center gap-1 border-r border-[var(--line)] px-3 py-3 sm:w-36">
                  <span className="flex items-center gap-2 text-paper">
                    <Icon name={track} size={16} className="text-ice" />
                    <span className="label">{t.name}</span>
                  </span>
                  <span className="code text-xs text-fog">{done}/{row.length}</span>
                </div>
                <ol ref={setRail(track)} className="flex flex-1 snap-x gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:thin]" aria-label={`${t.name} skills`}>
                  {row.map((n) => {
                    const locked = n.status === "locked";
                    return (
                      <li key={n.id} className="flex min-w-[140px] flex-1 snap-start">
                        <Link
                          ref={setAnchor(n.id)}
                          href={n.href}
                          aria-label={`${n.label}: ${STATUS_WORD[n.status]}`}
                          className={`frame flex min-h-11 w-full flex-col gap-2 px-3 py-2 ${locked ? "punched text-fog hover:text-paper" : "text-paper hover:bg-navy"}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <EdgeCode>{edgeCode(n)}</EdgeCode>
                            <Mark kind={n.status} size={16} className={locked ? "mr-2" : ""} />
                          </span>
                          <span className="display text-base leading-tight">{n.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <Perf />
            </div>
          );
        })}

        {splices && splices.length > 0 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {splices.map((s) => (
              <path
                key={`${s.from}-${s.to}`}
                d={s.d}
                fill="none"
                stroke="var(--ice)"
                strokeWidth={1.25}
                strokeDasharray="4 4"
                strokeOpacity={s.lit ? 1 : 0.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        )}
      </div>

      {/* The bridges as text: visible when the overlay cannot be drawn, read aloud otherwise. */}
      <div className={splices ? "sr-only" : ""}>
        <p className="label-sm text-fog">Splices between tracks</p>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {BRIDGES.map(([a, b]) => (
            <li key={`${a}-${b}`} className="flex items-center gap-1.5">
              <span>{byId[a].label}</span>
              <Icon name="next" size={12} className="text-ice" />
              <span>{byId[b].label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
