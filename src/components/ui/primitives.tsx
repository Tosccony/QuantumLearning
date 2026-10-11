import type { ReactNode } from "react";
import type { TrackId } from "@/lib/curriculum";
import Icon from "./Icon";

/** The folded tape flag that marks where you are. */
export function Flag({ className = "", width = 22 }: { className?: string; width?: number }) {
  const h = Math.round(width * 1.25);
  return (
    <svg width={width} height={h} viewBox="0 0 22 28" className={className} aria-hidden>
      <path d="M0 0h22v20l-11 8L0 20z" fill="var(--ice)" />
      <path d="M0 0h22v6H0z" fill="var(--ice-deep)" />
    </svg>
  );
}

/** Sprocket perforation strip. */
export function Perf({ className = "", ice = false }: { className?: string; ice?: boolean }) {
  return <div className={`perf ${ice ? "perf-ice" : ""} ${className}`} aria-hidden />;
}

/** Punched white window: running copy and foreign content live here. */
export function Window({ children, className = "", as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "aside" | "form" | "li" } & Record<string, unknown>) {
  return (
    <Tag className={`window ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export type MarkKind = "done" | "available" | "locked" | "current" | "stale";

/** State is a mark, never a hue. */
export function Mark({ kind, size = 18, className = "" }: { kind: MarkKind; size?: number; className?: string }) {
  if (kind === "done") return <Icon name="cross" size={size} className={`text-ice ${className}`} title="Completed" />;
  if (kind === "locked") return <Icon name="lock" size={size} className={`opacity-70 ${className}`} title="Locked" />;
  if (kind === "current") return <Flag width={Math.round(size * 0.8)} className={className} />;
  if (kind === "stale") return <Icon name="warn" size={size} className={`text-warn ${className}`} title="Changed since last run" />;
  return <span className={`inline-block border border-current ${className}`} style={{ width: size * 0.6, height: size * 0.6 }} role="img" aria-label="Available" />;
}

/** Tiny edge code in the perforation margin. */
export function EdgeCode({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`code text-[0.62rem] uppercase tracking-[0.12em] text-fog ${className}`}>{children}</span>;
}

/** A labelled readout: label above, value below, tabular numerals. */
export function Readout({ label, value, sub, className = "" }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="label-sm opacity-80">{label}</span>
      <span className="display num text-2xl leading-none">{value}</span>
      {sub && <span className="text-xs opacity-80">{sub}</span>}
    </div>
  );
}

export const TRACK_VAR: Record<TrackId, string> = {
  explorer: "var(--t-explorer)",
  student: "var(--t-student)",
  developer: "var(--t-developer)",
  researcher: "var(--t-researcher)",
  concepts: "var(--t-concepts)",
};

/** The one per-track hue, worn as a collar stripe on that track's frames. */
export function Stripe({ track, className = "" }: { track: TrackId; className?: string }) {
  return <span className={`block h-1 w-full ${className}`} style={{ background: TRACK_VAR[track] }} aria-hidden />;
}

/** A rail band with perforations above and below. */
export function Rail({ children, className = "", innerClassName = "" }: { children: ReactNode; className?: string; innerClassName?: string }) {
  return (
    <div className={`rail ${className}`}>
      <Perf />
      <div className={innerClassName}>{children}</div>
      <Perf />
    </div>
  );
}

/** Section heading in the display face with an optional edge code. */
export function Heading({ children, code, as: Tag = "h2", className = "" }: { children: ReactNode; code?: string; as?: "h1" | "h2" | "h3"; className?: string }) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Tag className="display text-2xl sm:text-3xl">{children}</Tag>
      {code && <EdgeCode className="whitespace-nowrap pb-1">{code}</EdgeCode>}
    </div>
  );
}

/** Inline notice drawn as a window strip. */
export function Notice({ children, tone = "info", role }: { children: ReactNode; tone?: "info" | "warn" | "bad" | "good"; role?: "alert" | "status" }) {
  const icon = tone === "bad" ? "warn" : tone === "warn" ? "warn" : tone === "good" ? "check" : "info";
  const color = tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : tone === "good" ? "text-good" : "text-ice";
  return (
    <p role={role} className={`flex items-start gap-2 border px-3 py-2 text-sm ${tone === "bad" ? "border-bad" : tone === "warn" ? "border-warn" : tone === "good" ? "border-good" : "border-[var(--line-strong)]"}`}>
      <Icon name={icon} size={16} className={`mt-0.5 shrink-0 ${color}`} />
      <span>{children}</span>
    </p>
  );
}
