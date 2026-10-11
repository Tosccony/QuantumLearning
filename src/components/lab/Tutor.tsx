"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Perf } from "@/components/ui/primitives";
import { labContext, offlineExplain, type Level } from "@/lib/explain";
import type { Circuit, RunResult } from "@/lib/quantum";

type Msg = { role: "user" | "assistant"; content: string; offline?: boolean };

const QUICK = [
  { label: "Explain this result", prompt: "Explain what this circuit does and why the results look the way they do." },
  { label: "What next?", prompt: "Suggest one experiment to try next in the Lab and what I should expect to see." },
  { label: "Quiz me", prompt: "Quiz me with one question about this circuit and its results. Wait for my answer." },
];

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

/** The tutor hangs beside the bench: a navy frame whose replies are punched white windows. */
export default function Tutor({ circuit, result, extra = "", compact, offline }: { circuit: Circuit; result: RunResult | null; extra?: string; compact?: boolean; offline?: boolean }) {
  const [level, setLevel] = useState<Level>("beginner");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);

  // Scroll the log itself: scrollIntoView would also scroll the page and, on mount, move the keyboard's Tab starting point here.
  useEffect(() => {
    const el = log.current;
    if (el && msgs.length) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs(history);
    setInput("");
    // Offline (e.g. on Qollab, where POST is blocked): answer from the run results without calling Claude.
    if (offline) return setMsgs([...history, { role: "assistant", content: offlineExplain(circuit, result, level), offline: true }]);
    setBusy(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level, context: labContext(circuit, result, extra), messages: history.filter((m) => !m.offline).map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => ({}));
        setOfflineReason(info.reason ?? "tutor unavailable");
        setMsgs([...history, { role: "assistant", content: offlineExplain(circuit, result, level), offline: true }]);
        return;
      }
      setOfflineReason(null);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMsgs([...history, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      setMsgs([...history, { role: "assistant", content: offlineExplain(circuit, result, level), offline: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`frame flex flex-col ${compact ? "max-h-[560px]" : "h-full min-h-[440px]"}`} aria-label={offline ? "Explainer" : "Tutor"}>
      <Perf />
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-2">
        <h2 className="display mr-auto flex items-center gap-2 text-lg"><Icon name="tutor" size={18} className="text-ice" /> {offline ? "Explainer" : "Tutor"}</h2>
        <div className="flex" role="group" aria-label="Explanation level">
          {LEVELS.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className={`-ml-px min-h-11 border px-2.5 label-sm ${level === l ? "border-ice bg-ice text-navy-ink" : "border-[var(--line-strong)] text-fog hover:text-paper"}`}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div ref={log} className="window flex-1 space-y-3 overflow-y-auto p-3 text-sm" aria-live="polite">
        {msgs.length === 0 && (
          <p className="text-[#46587a]">
            {offline
              ? "Explains your latest run from the real Qiskit results, at the level you pick."
              : "Ask anything about this circuit. The tutor reads the real Qiskit results (counts, Bloch vectors, purity, transpiled depth) and answers at the level you pick."}
          </p>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] bg-navy-ink px-3 py-2 text-paper">{m.content}</div>
          ) : (
            <div key={i} className="window strike px-3 py-2">
              {m.offline && <EdgeCode className="mb-1 block !text-[#46587a]">Offline explainer · built from your Qiskit results</EdgeCode>}
              {m.content ? <Markdown text={m.content} /> : <span className="blink text-[#46587a]">thinking…</span>}
            </div>
          ),
        )}
      </div>

      {offlineReason && (
        <p className="border-t border-[var(--line)] px-3 py-2 text-[0.7rem] text-fog">
          Claude tutor offline ({offlineReason}). Set <code className="code">ANTHROPIC_API_KEY</code> to enable free-form answers.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)] p-2">
        {(offline ? QUICK.slice(0, 1) : QUICK).map((q) => (
          <button key={q.label} type="button" className="chip min-h-11 hover:bg-[rgba(111,230,255,0.12)]" onClick={() => ask(q.prompt)} disabled={busy}>{q.label}</button>
        ))}
      </div>
      {!offline && (
      <form className="flex gap-2 p-2 pt-0" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Why do I only see 00 and 11?"
          className="field min-w-0 flex-1 text-sm"
          aria-label="Ask the tutor"
          maxLength={1000}
        />
        <button className="keycap-primary !px-4" disabled={busy || !input.trim()} aria-label="Send question"><Icon name="send" size={16} /></button>
      </form>
      )}
    </section>
  );
}
