import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="" width={36} height={36} className="rounded-[10px]" />
          <p className="text-[0.95rem] text-muted">
            Made by{" "}
            <a className="link" href={SITE.authorUrl}>
              {SITE.author}
            </a>
            . Released under the{" "}
            <a className="link" href={SITE.license}>
              MIT license
            </a>
            .
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem]">
          <Link className="text-muted hover:text-fg" href="/docs">
            Docs
          </Link>
          <Link className="text-muted hover:text-fg" href="/docs/installation">
            Install
          </Link>
          <Link className="text-muted hover:text-fg" href="/docs/benchmark">
            Benchmark
          </Link>
          <a className="text-muted hover:text-fg" href={SITE.github}>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
