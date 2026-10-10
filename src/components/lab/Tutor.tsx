"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { labContext, offlineExplain, type Level } from "@/lib/explain";
import type { Circuit, RunResult } from "@/lib/quantum";

type Msg = { role: "user" | "assistant"; content: string; offline?: boolean };

const QUICK = [
  { label: "Explain this result", prompt: "Explain what this circuit does and why the results look the way they do." },
  { label: "What should I try next?", prompt: "Suggest one experiment to try next in the Lab and what I should expect to see." },
  { label: "Quiz me", prompt: "Quiz me with one question about this circuit and its results. Wait for my answer." },
];

export default function Tutor({ circuit, result, extra = "", compact, offline }: { circuit: Circuit; result: RunResult | null; extra?: string; compact?: boolean; offline?: boolean }) {
  const [level, setLevel] = useState<Level>("beginner");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    <section className={`panel flex flex-col ${compact ? "max-h-[520px]" : "h-full min-h-[420px]"}`} aria-label="AI tutor">
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
        <h2 className="mr-auto font-semibold">{offline ? "🤖 Explainer" : "🤖 AI tutor"}</h2>
        <div className="flex rounded-lg bg-white/5 p-0.5 text-xs" role="radiogroup" aria-label="Explanation level">
          {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
            <button key={l} role="radio" aria-checked={level === l} onClick={() => setLevel(l)} className={`rounded-md px-2.5 py-1 capitalize ${level === l ? "bg-accent text-white" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {msgs.length === 0 && (
          <p className="text-muted">
            Ask anything about your circuit. The tutor sees the real Qiskit results (counts, Bloch vectors, purity, transpiled depth) and pitches the answer at the level you pick.
          </p>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-xl bg-accent px-3 py-2 text-white">{m.content}</div>
          ) : (
            <div key={i} className="rounded-xl bg-white/5 px-3 py-2">
              {m.offline && <p className="mb-1 text-[11px] uppercase tracking-wide text-on">Offline explainer · built from your Qiskit results</p>}
              {m.content ? <Markdown text={m.content} /> : <span className="animate-pulse text-muted">thinking…</span>}
            </div>
          ),
        )}
        <div ref={end} />
      </div>

      {offlineReason && (
        <p className="border-t border-white/10 px-3 py-2 text-[11px] text-muted">
          Claude tutor offline ({offlineReason}). Set <code>ANTHROPIC_API_KEY</code> to enable free-form answers.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-white/10 p-2">
        {QUICK.map((q) => (
          <button key={q.label} className="chip hover:bg-white/20" onClick={() => ask(q.prompt)} disabled={busy}>{q.label}</button>
        ))}
      </div>
      <form className="flex gap-2 p-2 pt-0" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Why do I only see 00 and 11?"
          className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          aria-label="Ask the tutor"
          maxLength={1000}
        />
        <button className="pbtn-primary" disabled={busy || !input.trim()}>Ask</button>
      </form>
    </section>
  );
}
