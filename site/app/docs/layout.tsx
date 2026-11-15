import { DocsPager } from "@/components/docs-pager";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 lg:px-8">
      <DocsSidebar />
      <div className="min-w-0 pb-20 pt-10 lg:pt-14">
        <article className="prose max-w-[46rem]">{children}</article>
        <DocsPager />
      </div>
    </div>
  );
}
