"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_PAGES } from "@/lib/docs";
import { SITE } from "@/lib/site";

export function DocsPager() {
  const pathname = usePathname();
  const i = DOC_PAGES.findIndex((p) => p.href === pathname);
  if (i < 0) return null;
  const prev = DOC_PAGES[i - 1];
  const next = DOC_PAGES[i + 1];
  const editPath = "README.md";

  return (
    <nav aria-label="Previous and next page" className="mt-16 max-w-[46rem] border-t border-line pt-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            className="pager-link group rounded-xl border border-line px-4 py-3 transition-colors hover:border-line-strong hover:bg-raised/60"
          >
            <span className="block text-[0.85rem] text-muted">Previous</span>
            <span className="block font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="pager-link group rounded-xl border border-line px-4 py-3 text-right transition-colors hover:border-line-strong hover:bg-raised/60"
          >
            <span className="block text-[0.85rem] text-muted">Next</span>
            <span className="block font-medium">{next.title}</span>
          </Link>
        ) : null}
      </div>
      <p className="mt-8 text-[0.9rem] text-muted">
        Found something out of date? The source of truth is the{" "}
        <a className="link" href={`${SITE.github}/blob/main/${editPath}`}>
          README on GitHub
        </a>
        .
      </p>
    </nav>
  );
}
