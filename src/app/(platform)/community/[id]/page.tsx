"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { getProject, starProject, type Project } from "@/lib/community";
import { useProgress } from "@/lib/progress";

export default function ProjectPage() {
  return (
    <Suspense fallback={null}>
      <ProjectView />
    </Suspense>
  );
}

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

  if (error) return <p role="alert" className="rounded-xl bg-bad/15 p-3 text-bad">{error}</p>;
  if (!p) return <p className="text-muted">Loading…</p>;

  const starred = state.starred.includes(p.id);
  const star = async () => {
    toggleStar(p.id);
    setP({ ...p, stars: p.stars + (starred ? -1 : 1) });
    await starProject(p.id, !starred).catch(() => {});
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        {isNew && <p className="rounded-xl bg-good/15 p-3 text-sm text-good">🎉 Published! Your circuit was re-run on Qiskit, and these are the verified results everyone will see. +50 XP</p>}
        <header className="flex flex-col gap-2">
          <Link href="/community" className="text-sm text-muted hover:text-ink">← Community</Link>
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="mr-auto text-3xl font-bold">{p.title}</h1>
            <button onClick={star} className={`pbtn-ghost ${starred ? "!text-on" : ""}`} aria-pressed={starred}>{starred ? "★ Starred" : "☆ Star"} · {p.stars}</button>
            <Link href={`/lab?fork=${p.id}`} className="pbtn-primary">⑂ Fork in Lab · {p.forks}</Link>
          </div>
          <p className="text-sm text-muted">
            by <b className="text-ink">{p.author}</b> · {new Date(p.created_at).toLocaleDateString()}
            {p.forked_from && <> · forked from <Link className="underline" href={`/community/${p.forked_from}`}>another project</Link></>}
          </p>
          <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
          {p.description && <p className="mt-2 leading-relaxed">{p.description}</p>}
        </header>

        <section className="panel flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <h2 className="mr-auto font-semibold">Circuit · {p.circuit.qubits} qubits · {p.circuit.ops.length} gates</h2>
            <button className="pbtn-ghost" onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Link copied" : "Copy link"}</button>
          </div>
          <CircuitEditor qubits={p.circuit.qubits} ops={ops} readOnly />
        </section>

        {p.results && <ResultsPanel result={p.results} circuit={p.circuit} />}
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Tutor compact circuit={p.circuit} result={p.results ?? null} extra={`Community project “${p.title}” by ${p.author}: ${p.description}`} />
      </aside>
    </div>
  );
}
