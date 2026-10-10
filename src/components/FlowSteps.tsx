const STEPS = [
  { key: "learn", icon: "📘", label: "Learn" },
  { key: "build", icon: "🧩", label: "Build" },
  { key: "run", icon: "▶️", label: "Run" },
  { key: "understand", icon: "💡", label: "Understand" },
  { key: "share", icon: "🌍", label: "Share" },
] as const;

export type FlowStep = (typeof STEPS)[number]["key"];

/** The platform's core loop, highlighted at the learner's current stage. */
export default function FlowSteps({ current, done = [] }: { current: FlowStep; done?: FlowStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs sm:text-sm" aria-label="Learning flow">
      {STEPS.map((s, i) => {
        const isDone = done.includes(s.key);
        const isCur = s.key === current;
        return (
          <li key={s.key} className="flex items-center gap-1">
            <span
              aria-current={isCur ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${isCur ? "bg-accent font-semibold text-white" : isDone ? "bg-good/20 text-good" : "bg-white/5 text-muted"}`}
            >
              <span aria-hidden>{isDone && !isCur ? "✓" : s.icon}</span> {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted" aria-hidden>→</span>}
          </li>
        );
      })}
    </ol>
  );
}
