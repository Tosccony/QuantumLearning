"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Notice, Perf } from "@/components/ui/primitives";
import { getProject, starProject, type Project } from "@/lib/community";
import { useProgress } from "@/lib/progress";

export default function ProjectPage() {
  return (
    <Suspense fallback={null}>
      <ProjectView />
    </Suspense>
  );
}

/** One shared circuit: header on navy, the circuit as frames, verified results in a window. */
function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const { state, toggleStar } = useProgress();
  const [p, setP] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ops = useMemo(() => (p ? layout(p.circuit) : []), [p]);

  useEffect(() => {
    getProject(id).then(setP).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Notice tone="bad" role="alert">{error}</Notice>;
  if (!p) return <Notice tone="info" role="status"><span className="blink">Loading project…</span></Notice>;

  const starred = state.starred.includes(p.id);
  const star = async () => {
    toggleStar(p.id);
    setP({ ...p, stars: p.stars + (starred ? -1 : 1) });
    await starProject(p.id, !starred).catch(() => {});
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        {isNew && (
          <Notice tone="good" role="status">
            Published. Your circuit was re-run on the Qiskit Aer simulator, and these are the verified results everyone will see. <span className="code">+50 XP</span>
          </Notice>
        )}

        <header className="flex flex-col gap-3">
          <Link href="/community" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} /> Community
          </Link>
          <div className="flex flex-wrap items-start gap-3">
            <div className="mr-auto min-w-0">
              <Heading as="h1">{p.title}</Heading>
            </div>
            <button type="button" onClick={star} className={`keycap ${starred ? "bg-[rgba(111,230,255,0.14)]" : ""}`} aria-pressed={starred} aria-label={`${starred ? "Unstar" : "Star"} this project, ${p.stars} stars`}>
              <Icon name={starred ? "star-filled" : "star"} size={14} />
              {starred ? "Starred" : "Star"} <span className="code">{p.stars}</span>
            </button>
            <Link href={`/lab?fork=${p.id}`} className="keycap-primary">
              <Icon name="fork" size={14} /> Fork in Lab <span className="code">{p.forks}</span>
            </Link>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fog">
            <span className="flex items-center gap-1.5"><Icon name="user" size={13} /> <b className="text-paper">{p.author}</b></span>
            <span aria-hidden>·</span>
            <time dateTime={p.created_at} className="code text-xs">{new Date(p.created_at).toLocaleDateString()}</time>
            {p.forked_from && (
              <>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1.5">
                  <Icon name="fork" size={13} /> forked from <Link className="underline underline-offset-2 hover:text-paper" href={`/community/${p.forked_from}`}>another project</Link>
                </span>
              </>
            )}
          </p>
          {p.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
          {p.description && <p className="max-w-prose leading-relaxed">{p.description}</p>}
        </header>

        <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label="Circuit">
          <Perf />
          <div className="flex flex-col gap-3 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-auto flex items-center gap-3">
                <Icon name="chip" size={18} className="text-ice" />
                <h2 className="display text-xl sm:text-2xl">Circuit</h2>
                <EdgeCode>{p.circuit.qubits}Q · {p.circuit.ops.length} GATES · {p.shots.toLocaleString()} SHOTS</EdgeCode>
              </div>
              <button type="button" className="keycap" onClick={copyLink} aria-live="polite">
                <Icon name={copied ? "check" : "link"} size={14} /> {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
            <div className="frame overflow-x-auto p-3">
              <CircuitEditor qubits={p.circuit.qubits} ops={ops} readOnly />
            </div>
          </div>
          <Perf />
        </section>

        {p.results && <ResultsPanel result={p.results} circuit={p.circuit} />}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Tutor compact circuit={p.circuit} result={p.results ?? null} extra={`Community project “${p.title}” by ${p.author}: ${p.description}`} />
      </div>
    </div>
  );
}
