import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

type Level = "beginner" | "intermediate" | "advanced";
type ChatTurn = { role: "user" | "assistant"; content: string };

const LEVELS: Record<Level, string> = {
  beginner:
    "The learner is a beginner (roughly high-school level). Use plain language and one concrete analogy. Avoid equations unless one tiny one really helps. Keep answers under 150 words.",
  intermediate:
    "The learner knows linear algebra basics and Dirac notation. Use kets, amplitudes and Bloch-sphere language, and show short derivations. Keep answers under 250 words.",
  advanced:
    "The learner is at graduate level. Be precise: density matrices, stabilisers, complexity and hardware realities are all fair game. Reference the actual numbers in the run. Keep answers under 350 words.",
};

// Stable across requests so it can be prompt-cached; per-request Lab context goes in the user turn.
const SYSTEM = `You are the Quantum Quest tutor inside an interactive quantum computing lab.

Every circuit the learner runs is executed by Qiskit (Aer simulator, optionally with a noise model), and the context you receive contains the real results: counts, exact probabilities, per-qubit Bloch vectors and purities from partial traces, the text circuit diagram, and transpiled depth/gate counts.

How to tutor:
- Ground explanations in the provided results. Quote the actual numbers when they make the point.
- Qiskit bitstrings are little-endian: the right-most character is qubit 0.
- Be correct above all. If the context doesn't contain something, say so rather than guessing.
- Encourage experimentation: end with one concrete thing to try in the Lab (a gate to add or a parameter to change) and what they should expect to see.
- When asked to quiz, ask one question at a time and wait for the answer before revealing it.
- Format with short paragraphs and occasional bullet lists. Use \`code\` for gate names. No headings.`;

export async function POST(req: Request) {
  const { level = "beginner", messages = [], context = "" } = (await req.json()) as {
    level?: Level;
    messages?: ChatTurn[];
    context?: string;
  };

  const history = messages.slice(-12).filter((m) => m.content?.trim());
  if (!history.length || history[history.length - 1].role !== "user") {
    return Response.json({ error: "Last message must be from the user." }, { status: 400 });
  }
  const last = history[history.length - 1];
  const turns: Anthropic.Beta.BetaMessageParam[] = [
    ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user",
      content: `<lab_context>\n${context.slice(0, 12000)}\n</lab_context>\n\n<explanation_level>${LEVELS[level] ?? LEVELS.beginner}</explanation_level>\n\n${last.content.slice(0, 4000)}`,
    },
  ];

  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: turns,
    });

    const it = stream[Symbol.asyncIterator]();
    // Pull the first event before responding so auth/config errors become a clean 503.
    const first = await it.next();
    const encoder = new TextEncoder();

    const body = new ReadableStream({
      async start(controller) {
        const emit = (ev: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>) => {
          if (!ev.done && ev.value.type === "content_block_delta" && ev.value.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(ev.value.delta.text));
          }
        };
        try {
          emit(first);
          for (let ev = await it.next(); !ev.done; ev = await it.next()) emit(ev);
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\nI can't help with that one. Try asking about the circuit or results in the Lab."));
          if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("\n\n(answer truncated)"));
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n[tutor error: ${err instanceof Anthropic.APIError ? err.message : "connection lost"}]`));
        }
        controller.close();
      },
    });
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (err) {
    // No credentials, bad key, rate limit, network: the client falls back to the offline explainer.
    const status = err instanceof Anthropic.RateLimitError ? 429 : 503;
    const reason =
      err instanceof Anthropic.AuthenticationError ? "invalid API key"
      : err instanceof Anthropic.RateLimitError ? "rate limited"
      : err instanceof Anthropic.APIConnectionError ? "can't reach the Claude API"
      : err instanceof Anthropic.APIError ? err.message
      : "no Anthropic credentials configured";
    return Response.json({ offline: true, reason }, { status });
  }
}
