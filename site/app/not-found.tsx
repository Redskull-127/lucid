import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sky flex flex-1 items-center border-b border-line">
      <div className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)]">This page isn’t in the plan</h1>
        <p className="lede mt-4 max-w-[34rem]">The link may be out of date, or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            Go to the homepage
          </Link>
          <Link href="/docs" className="btn btn-ghost">
            Browse the docs
          </Link>
        </div>
      </div>
    </section>
  );
}
