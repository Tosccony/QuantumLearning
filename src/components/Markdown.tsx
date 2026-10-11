import { Fragment } from "react";

/** Minimal Markdown for lesson text and tutor replies: paragraphs, bullets, simple | tables, ``` blocks, `code`, **bold**, [links](https://…). */
export default function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/```/);
  return (
    <div className={`prose-q ${className}`}>
      {blocks.map((b, i) =>
        i % 2 ? (
          <pre key={i} tabIndex={0}><code>{b.replace(/^\w*\n/, "").replace(/\n$/, "")}</code></pre>
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
              // A header row "| a | b |" followed by list-style rows "- x → y" or pipe rows.
              if (/^\|.*\|\s*$/.test(lines[0]) && lines.length > 1) {
                const head = cells(lines[0]);
                const body = lines.slice(1).filter((l) => !/^\|?\s*-{2,}/.test(l)).map((l) => (/^\|/.test(l) ? cells(l) : l.replace(/^(\s*[-•]|\d+\.)\s/, "").split(/\s*(?:→|->|\|)\s*/)));
                return (
                  <table key={`${i}-${j}`} className="my-3 w-full max-w-md border-collapse text-sm">
                    <thead>
                      <tr>{head.map((h, k) => <th key={k} className="label-sm border-b border-current pb-1 pr-4 text-left opacity-80">{inline(h)}</th>)}</tr>
                    </thead>
                    <tbody className="code">
                      {body.map((r, k) => (
                        <tr key={k}>{r.map((c, m) => <td key={m} className="border-b border-current/20 py-1 pr-4">{inline(c)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                );
              }
              return <p key={`${i}-${j}`}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>;
            })
        ),
      )}
    </div>
  );
}

const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/** Only http(s) links become anchors; anything else (javascript:, data:, relative) stays plain text. */
const safeUrl = (u: string) => /^https?:\/\//i.test(u.trim());

function inline(s: string) {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, k) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    return part.startsWith("`") && part.endsWith("`") ? <code key={k}>{part.slice(1, -1)}</code>
      : part.startsWith("**") && part.endsWith("**") ? <strong key={k}>{part.slice(2, -2)}</strong>
      : link && safeUrl(link[2]) ? <a key={k} href={link[2].trim()} target="_blank" rel="noopener noreferrer">{link[1]}<span className="sr-only"> (opens in a new tab)</span></a>
      : <Fragment key={k}>{part}</Fragment>;
  });
}
