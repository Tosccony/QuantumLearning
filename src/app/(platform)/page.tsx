"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listProjects, type Project } from "@/lib/community";
import { moduleById, TRACKS } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { nextModule, trackProgress } from "@/lib/skills";

const FLOW = [
  { icon: "📘", title: "Learn", text: "Short lessons with just enough maths for your level.", href: "/learn" },
  { icon: "🧩", title: "Build", text: "Drag gates onto wires in the visual circuit builder.", href: "/lab" },
  { icon: "▶️", title: "Run", text: "Execute on a real Qiskit backend, ideal or noisy.", href: "/lab" },
  { icon: "💡", title: "Understand", text: "Histograms, Bloch spheres, statevectors and an AI tutor.", href: "/lab" },
  { icon: "🌍", title: "Share", text: "Publish to the community. Others star and fork your work.", href: "/community" },
];

export default function Home() {
  const { state, ready } = useProgress();
  const [featured, setFeatured] = useState<Project[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    listProjects("stars").then((p) => setFeatured(p.slice(0, 3))).catch(() => setOffline(true));
  }, []);

  const resume = ready ? nextModule(state) : undefined;
  const started = ready && Object.keys(state.modules).length > 0;

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-center gap-8 py-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5">
          <p className="chip w-fit">⚛ Real circuits · Qiskit-powered</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Learn quantum computing by <span className="text-on">building real circuits</span>.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            From a child&apos;s first light switch to quantum error correction. Every experiment runs as a genuine Qiskit circuit, and every result can be explained, remixed and shared.
          </p>
          <div className="flex flex-wrap gap-3">
            {started && resume ? (
              <Link href={`/learn/${resume.id}`} className="pbtn-primary !px-5 !py-3 !text-base">Continue: {resume.title} →</Link>
            ) : (
              <Link href="/learn" className="pbtn-primary !px-5 !py-3 !text-base">Start learning →</Link>
            )}
            <Link href="/lab" className="pbtn-ghost !px-5 !py-3 !text-base">Open the Lab</Link>
          </div>
        </div>
        <ol className="panel flex flex-col gap-1 p-3" aria-label="How it works">
          {FLOW.map((f, i) => (
            <li key={f.title}>
              <Link href={f.href} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl" aria-hidden>{f.icon}</span>
                <span>
                  <b>{i + 1}. {f.title}</b>
                  <span className="block text-sm text-muted">{f.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Four tracks plus deep-dive concepts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TRACKS.map((t) => {
            const p = ready ? trackProgress(state, t.id) : { done: 0, total: 1 };
            return (
              <Link key={t.id} href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className="panel flex flex-col gap-2 p-4 transition hover:ring-white/30">
                <span className="text-3xl" aria-hidden>{t.icon}</span>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs text-muted">{t.audience}</p>
                <p className="text-sm">{t.tagline}</p>
                <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${(p.done / p.total) * 100}%`, background: t.color }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end gap-3">
          <h2 className="mr-auto text-2xl font-bold">From the community</h2>
          <Link href="/community" className="text-sm text-accent">See all →</Link>
        </div>
        {offline ? (
          <p className="panel p-4 text-sm text-muted">The Qiskit service isn&apos;t running, so community projects and the Lab are unavailable. Start it with <code>npm run backend</code>.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {(featured ?? []).map((p) => (
              <Link key={p.id} href={`/community/${p.id}`} className="panel flex flex-col gap-1 p-4 hover:ring-white/30">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="line-clamp-2 text-sm text-muted">{p.description}</p>
                <p className="mt-auto pt-2 text-xs text-muted">by {p.author} · ★ {p.stars} · ⑂ {p.forks}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {started && resume && (
        <p className="text-center text-sm text-muted">Up next in your skill tree: <Link className="text-accent" href={`/learn/${resume.id}`}>{moduleById(resume.id)?.skill}</Link></p>
      )}
    </div>
  );
}
