import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDoc } from "@/lib/docs";

/** Per-page metadata for a docs route, with its canonical URL. */
export function docMetadata(href: string): Metadata {
  const page = getDoc(href);
  const title = href === "/docs" ? "Docs" : page.title;
  return {
    title,
    description: page.description,
    alternates: { canonical: href },
    openGraph: { title: `${title} – lucid`, description: page.description, url: href, siteName: "lucid", type: "article" },
    twitter: { card: "summary_large_image", title: `${title} – lucid`, description: page.description },
  };
}

export function DocHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header>
      <h1>{title}</h1>
      {children ? <p className="doc-lede">{children}</p> : null}
    </header>
  );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id}>
      {children}
      <a href={`#${id}`} className="anchor" aria-label="Link to this section">
        #
      </a>
    </h2>
  );
}

export function H3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id}>
      {children}
      <a href={`#${id}`} className="anchor" aria-label="Link to this section">
        #
      </a>
    </h3>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <aside className="callout">{children}</aside>;
}

export function Table({
  head,
  rows,
  numeric = [],
  keys = false,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  numeric?: number[];
  /** First column holds short identifiers (flags, variables) that shouldn't break. */
  keys?: boolean;
}) {
  return (
    <div className={keys ? "table-wrap keys" : "table-wrap"} tabIndex={0} role="region" aria-label="Scrollable table">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={numeric.includes(i) ? "num" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={numeric.includes(ci) ? "num" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
