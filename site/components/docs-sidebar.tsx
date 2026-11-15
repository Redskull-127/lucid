"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DOC_GROUPS, DOC_PAGES } from "@/lib/docs";

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = DOC_PAGES.find((p) => p.href === pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-line px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-16 lg:mx-0 lg:self-start lg:border-b-0 lg:px-0 lg:backdrop-blur-none [background:var(--header-bg)] lg:[background:none]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-3 text-left lg:hidden"
        aria-expanded={open}
        aria-controls="docs-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="text-[0.9rem] text-muted">Docs</span>
          <span className="truncate font-medium">{current?.title ?? "Menu"}</span>
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">, menu</span>
      </button>

      <nav
        id="docs-nav"
        aria-label="Documentation"
        className={`${open ? "block" : "hidden"} absolute inset-x-0 top-full max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-line bg-bg px-4 pb-6 pt-2 shadow-[var(--shadow)] sm:px-6 lg:static lg:block lg:max-h-[calc(100dvh-4rem)] lg:border-0 lg:bg-transparent lg:px-0 lg:pb-12 lg:pt-12 lg:shadow-none`}
      >
        {DOC_GROUPS.map((group) => (
          <div key={group.title} className="mt-5 first:mt-0 lg:mt-7">
            <p className="px-3 text-[0.85rem] font-medium text-muted">{group.title}</p>
            <ul className="mt-1.5 space-y-0.5">
              {group.pages.map((page) => {
                const active = page.href === pathname;
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`relative block rounded-lg px-3 py-1.5 text-[0.95rem] transition-colors ${
                        active ? "bg-raised font-medium text-fg" : "text-muted hover:bg-raised/60 hover:text-fg"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                          style={{ background: "linear-gradient(var(--lid-a), var(--lid-b), var(--lid-c))" }}
                        />
                      ) : null}
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
