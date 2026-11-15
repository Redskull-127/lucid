import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";

export type Lang = "shell" | "claude" | "output" | "text";

/** Tiny, dependency-free highlighting: just enough to separate commands, flags, strings and comments. */
function highlightShell(line: string, key: number): ReactNode {
  // split off a trailing comment ( # ...) that isn't inside quotes
  let inSingle = false;
  let inDouble = false;
  let commentAt = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "#" && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      commentAt = i;
      break;
    }
  }
  const body = commentAt >= 0 ? line.slice(0, commentAt) : line;
  const comment = commentAt >= 0 ? line.slice(commentAt) : "";

  const parts: ReactNode[] = [];
  const re = /("[^"]*"|'[^']*'|\s--?[A-Za-z][\w-]*|^\s*[\w./-]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(body))) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    const tok = m[0];
    const cls = tok.startsWith('"') || tok.startsWith("'") ? "tok-str" : /^\s--?/.test(tok) ? "tok-flag" : "tok-cmd";
    parts.push(
      <span key={n++} className={cls}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < body.length) parts.push(body.slice(last));
  if (comment)
    parts.push(
      <span key="c" className="tok-comment">
        {comment}
      </span>,
    );
  return (
    <span key={key} className="line">
      {parts}
    </span>
  );
}

function highlightOutput(line: string, key: number): ReactNode {
  let cls = "";
  if (line.startsWith("@@")) cls = "tok-meta";
  else if (line.startsWith("+")) cls = "tok-add";
  else if (/^#\d+ PLAN CHANGED/.test(line)) cls = "tok-head";
  else if (line.startsWith("[lucid]") || line.startsWith("lucid:")) cls = "tok-cmd";
  else if (line.startsWith("↳")) cls = "tok-meta";
  return (
    <span key={key} className={`line ${cls}`}>
      {line || " "}
    </span>
  );
}

function highlightClaude(line: string, key: number): ReactNode {
  const m = line.match(/^(\/[\w:-]+)(.*)$/);
  return (
    <span key={key} className="line">
      {m ? (
        <>
          <span className="tok-cmd">{m[1]}</span>
          {m[2]}
        </>
      ) : (
        line
      )}
    </span>
  );
}

export function renderLines(code: string, lang: Lang): ReactNode[] {
  const lines = code.replace(/^\n/, "").replace(/\n$/, "").split("\n");
  return lines.map((l, i) => {
    if (lang === "shell") return highlightShell(l, i);
    if (lang === "claude") return highlightClaude(l, i);
    if (lang === "output") return highlightOutput(l, i);
    return (
      <span key={i} className="line">
        {l || " "}
      </span>
    );
  });
}

type Props = {
  code: string;
  lang?: Lang;
  /** Where this runs, e.g. "In Claude Code" or "In your terminal". */
  label?: string;
  copy?: boolean;
  /** What the copy button copies, for its accessible name. */
  what?: string;
};

export function CodeBlock({ code, lang = "shell", label, copy = true, what }: Props) {
  const text = code.replace(/^\n/, "").replace(/\n$/, "");
  return (
    <figure className="code">
      {label ? <figcaption className="code-label">{label}</figcaption> : null}
      <div className="code-body">
        <pre tabIndex={0}>
          <code>{renderLines(text, lang)}</code>
        </pre>
        {copy ? <CopyButton text={text} what={what ?? (label ? `${label.toLowerCase()} snippet` : "code")} /> : null}
      </div>
    </figure>
  );
}
