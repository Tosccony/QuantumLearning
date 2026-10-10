import { shotNoiseTvd, tvd } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

/** Puts a number on "how far is this machine from a perfect one" for the run just made. */
export default function IdealVsMachine({ result, hint }: { result: RunResult; hint?: string }) {
  const d = tvd(result);
  const noisy = d > 2 * shotNoiseTvd(result) + 0.01;
  return (
    <p className="rounded-xl bg-white/5 p-3 text-sm" role="note">
      <b>Ideal vs {result.backend}:</b> distance {d.toFixed(3)}.{" "}
      {noisy
        ? "Noise is visible: the bars drift away from the exact (ideal) markers, and outcomes a perfect machine never gives start to appear."
        : "This matches a perfect machine, apart from normal shot-to-shot wobble."}
      {!noisy && hint ? ` ${hint}` : ""}
    </p>
  );
}
