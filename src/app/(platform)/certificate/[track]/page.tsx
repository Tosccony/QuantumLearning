"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { PLANETS } from "@/lib/levels";
import { useProgress } from "@/lib/progress";
import { certificate, trackProgress } from "@/lib/skills";

export default function CertificatePage() {
  const { track } = useParams<{ track: string }>();
  const t = TRACKS.find((x) => x.id === track);
  const { state, ready } = useProgress();
  if (!t) notFound();
  if (!ready) return null;

  const c = certificate(state, t.id as TrackId);
  const p = trackProgress(state, t.id);
  if (!c)
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden>🔒</span>
        <h1 className="text-2xl font-bold">{t.certificate} certificate</h1>
        <p className="text-muted">Complete all {p.total} {t.id === "explorer" ? "planets" : "modules"} of the {t.name} track to earn it. You&apos;ve done {p.done}.</p>
        <Link href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className="pbtn-primary">Continue the track</Link>
      </div>
    );

  const skills = t.id === "explorer" ? PLANETS.map((x) => x.concept) : modulesOf(t.id as Exclude<TrackId, "explorer">).map((m) => m.skill);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 print:hidden">
        <button className="pbtn-primary" onClick={() => window.print()}>🖨 Print / save as PDF</button>
        <Link href="/progress" className="pbtn-ghost">Back to progress</Link>
      </div>
      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#fdfbf4] p-10 text-center text-[#1b2160] shadow-2xl print:shadow-none" aria-label="Certificate">
        <div className="pointer-events-none absolute inset-3 rounded-2xl border-4 border-double" style={{ borderColor: t.color }} />
        <p className="text-sm uppercase tracking-[0.3em] text-[#6b6f99]">Quantum Quest · Certificate of completion</p>
        <h1 className="mt-6 text-4xl font-bold">{t.certificate}</h1>
        <p className="mt-6 text-[#6b6f99]">This certifies that</p>
        <p className="mt-2 font-[family-name:var(--font-fredoka)] text-4xl">{state.name || "Quantum Explorer"}</p>
        <p className="mx-auto mt-4 max-w-xl text-[#3b3f6b]">
          completed every {t.id === "explorer" ? "planet" : "module"} of the {t.name} track, running real quantum circuits on Qiskit and demonstrating:
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium">{skills.join(" · ")}</p>
        <div className="mt-10 flex items-end justify-between text-left text-xs text-[#6b6f99]">
          <div>
            <p>Issued</p>
            <p className="text-sm font-semibold text-[#1b2160]">{new Date(c.issued).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <span className="text-5xl" aria-hidden>🏅</span>
          <div className="text-right">
            <p>Credential ID</p>
            <p className="font-mono text-sm font-semibold text-[#1b2160]">{c.id}</p>
          </div>
        </div>
      </section>
      <p className="max-w-xl text-center text-xs text-muted print:hidden">Certificates are issued from progress stored on this device. Verifiable, account-backed credentials need the planned Supabase accounts.</p>
    </div>
  );
}
