"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { Stripe, Window } from "@/components/ui/primitives";
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
  const unit = t.id === "explorer" ? "planet" : "module";

  if (!c)
    return (
      <Window as="section" className="mx-auto my-8 flex w-full max-w-lg flex-col items-center gap-4 p-6 text-center sm:my-16 sm:p-8" aria-labelledby="cert-locked-heading">
        <Stripe track={t.id} className="absolute inset-x-0 top-0" />
        <span className="flex h-14 w-14 items-center justify-center border border-navy-ink" aria-hidden>
          <Icon name="lock" size={28} />
        </span>
        <h1 id="cert-locked-heading" className="display text-3xl">{t.certificate} certificate</h1>
        <p className="max-w-prose text-[#46587a]">
          Complete all {p.total} {unit}s of the {t.name} track to earn it. You&apos;ve done {p.done}.
        </p>
        <p className="code text-sm text-[#46587a]">{p.done}/{p.total} {unit}s</p>
        <Link href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className="keycap-paper-primary">
          Continue the track
          <Icon name="next" size={16} />
        </Link>
      </Window>
    );

  const skills = t.id === "explorer" ? PLANETS.map((x) => x.concept) : modulesOf(t.id as Exclude<TrackId, "explorer">).map((m) => m.skill);
  const issued = new Date(c.issued).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col items-center gap-5 print:gap-0">
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <button type="button" className="keycap-primary" onClick={() => window.print()}>
          <Icon name="print" size={16} />
          Print / save as PDF
        </button>
        <Link href="/progress" className="keycap">
          <Icon name="back" size={16} />
          Back to progress
        </Link>
      </div>

      {/* The certificate stays on paper so it prints as it reads. */}
      <Window as="section" className="w-full max-w-3xl p-3 [print-color-adjust:exact] print:max-w-none print:p-0" aria-label="Certificate">
        <Stripe track={t.id} className="absolute inset-x-0 top-0" />
        <div className="border border-navy-ink p-1">
          <div className="flex flex-col items-center border border-navy-ink px-5 py-8 text-center sm:px-10 sm:py-12">
            <p className="label text-[#46587a]">Quantum Quest · Certificate of completion</p>
            <h1 className="display mt-6 text-4xl sm:text-5xl">{t.certificate}</h1>

            <p className="mt-8 text-[#46587a]">This certifies that</p>
            <p className="display mt-2 text-3xl sm:text-4xl">{state.name || "Quantum Explorer"}</p>

            <p className="mt-6 max-w-xl text-[#46587a]">
              completed every {unit} of the {t.name} track, running real quantum circuits on the Qiskit Aer simulator and demonstrating:
            </p>
            <ul className="code mt-4 flex max-w-xl flex-wrap justify-center gap-x-3 gap-y-1 text-sm" aria-label="Skills demonstrated">
              {skills.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="text-[#46587a]">·</span>}
                  <span>{s}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 grid w-full grid-cols-[1fr_auto_1fr] items-end gap-4 border-t border-paper-3 pt-5 text-left">
              <div>
                <p className="label-sm text-[#46587a]">Issued</p>
                <p className="code mt-1 text-sm">{issued}</p>
              </div>
              <span className="flex h-16 w-16 items-center justify-center border border-navy-ink" aria-hidden>
                <Icon name="badge" size={48} strokeWidth={1.25} />
              </span>
              <div className="text-right">
                <p className="label-sm text-[#46587a]">Credential ID</p>
                <p className="code mt-1 text-sm">{c.id}</p>
              </div>
            </div>
          </div>
        </div>
      </Window>

      <p className="max-w-xl text-center text-xs text-fog print:hidden">
        Certificates are issued from progress stored on this device. Verifiable, account-backed credentials need the planned Supabase accounts.
      </p>
    </div>
  );
}
