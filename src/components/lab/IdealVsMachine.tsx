import Icon from "@/components/ui/Icon";
import { leakedOutcomes, noiseVisible, tvd } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

/** Puts a number on "how far is this machine from a perfect one" for the run just made. */
export default function IdealVsMachine({ result, hint }: { result: RunResult; hint?: string }) {
  const d = tvd(result);
  const noisy = noiseVisible(result);
  const leak = leakedOutcomes(result).length > 0;
  return (
    <div className="frame flex items-start gap-3 px-3 py-2.5 text-sm text-paper" role="note">
      <Icon name="noise" size={16} className="mt-0.5 shrink-0 text-ice" />
      <div className="min-w-0">
        <p className="label-sm flex flex-wrap items-center gap-x-3 text-fog">
          <span>Ideal vs {result.backend}</span>
          <span className="code normal-case tracking-normal text-paper">distance {d.toFixed(3)}</span>
        </p>
        <p className="mt-0.5 leading-relaxed">
          {noisy
            ? `Noise is visible: the bars drift away from the exact (ideal) markers${leak ? ", and outcomes a perfect machine never gives have appeared" : ""}.`
            : `No noise shows above the normal shot-to-shot wobble at ${result.shots} shots.${hint ? ` ${hint}` : ""}`}
        </p>
      </div>
    </div>
  );
}
