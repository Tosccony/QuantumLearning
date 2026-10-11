import Icon, { type IconName } from "@/components/ui/Icon";
import { Flag } from "@/components/ui/primitives";

const STEPS: { key: string; icon: IconName; label: string }[] = [
  { key: "learn", icon: "learn", label: "Learn" },
  { key: "build", icon: "chip", label: "Build" },
  { key: "run", icon: "run", label: "Run" },
  { key: "understand", icon: "tutor", label: "Understand" },
];

export type FlowStep = "learn" | "build" | "run" | "understand";

/** The platform's loop as four frames on a short rail; a cross marks done, a flag marks now. */
export default function FlowSteps({ current, done = [] }: { current: FlowStep; done?: FlowStep[] }) {
  return (
    <ol className="flex items-stretch" aria-label="Learning flow">
      {STEPS.map((s) => {
        const isDone = done.includes(s.key as FlowStep);
        const isCur = s.key === current;
        return (
          <li key={s.key} className={`frame relative -ml-px flex min-h-9 items-center gap-1.5 px-2.5 ${isCur ? "frame-active text-paper" : isDone ? "text-paper" : "text-fog"}`} aria-current={isCur ? "step" : undefined}>
            {isCur && <Flag className="absolute -top-2.5 left-1.5" width={12} />}
            {isDone && !isCur ? <Icon name="cross" size={12} className="text-ice" title="done" /> : <Icon name={s.icon} size={13} />}
            <span className="label-sm hidden sm:inline">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
