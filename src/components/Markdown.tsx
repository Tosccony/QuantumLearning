import { Fragment } from "react";

/** Minimal Markdown for lesson text and tutor replies: paragraphs, bullets, ``` blocks, `code`, **bold**. */
export default function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/);
  return (
    <div className="prose-q">
      {blocks.map((b, i) =>
        i % 2 ? (
          <pre key={i}><code>{b.replace(/^\w*\n/, "").replace(/\n$/, "")}</code></pre>
        ) : (
          b
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p, j) => {
              const lines = p.trim().split("\n");
              if (lines.every((l) => /^(\s*[-•]|\d+\.)\s/.test(l)))
                return (
                  <ul key={`${i}-${j}`}>
                    {lines.map((l, k) => <li key={k}>{inline(l.replace(/^(\s*[-•]|\d+\.)\s/, ""))}</li>)}
                  </ul>
                );
              return <p key={`${i}-${j}`}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>;
            })
        ),
      )}
    </div>
  );
}

function inline(s: string) {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, k) =>
    part.startsWith("`") && part.endsWith("`") ? <code key={k}>{part.slice(1, -1)}</code>
    : part.startsWith("**") && part.endsWith("**") ? <strong key={k}>{part.slice(2, -2)}</strong>
    : <Fragment key={k}>{part}</Fragment>,
  );
}
