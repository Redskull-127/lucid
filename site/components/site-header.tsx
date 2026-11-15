import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

export function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-line backdrop-blur-md"
      style={{ background: "var(--header-bg)" }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2.5 rounded-lg py-1 pr-2" aria-label="lucid home">
          <Image src="/icon.png" alt="" width={32} height={32} className="rounded-[9px]" />
          <span className="font-display text-[1.3rem] font-semibold tracking-[-0.02em]">lucid</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[0.95rem]">
          <Link href="/docs" className="rounded-full px-3 py-2 text-muted transition-colors hover:text-fg">
            Docs
          </Link>
          <Link
            href="/docs/benchmark"
            className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:text-fg sm:inline-block"
          >
            Benchmark
          </Link>
          <a
            href={SITE.github}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-muted transition-colors hover:text-fg"
          >
            <GitHubMark />
            <span className="hidden sm:inline">GitHub</span>
            <span className="sr-only sm:hidden">GitHub</span>
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
