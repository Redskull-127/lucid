"use client";

import { usePathname } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { DOC_PAGES } from "@/lib/docs";
import { SITE } from "@/lib/site";

/** TechArticle + breadcrumbs for the current docs page. Server-rendered into the static HTML like any client component. */
export function DocJsonLd() {
  const pathname = usePathname();
  const page = DOC_PAGES.find((p) => p.href === pathname);
  if (!page) return null;
  const url = `${SITE.url}${page.href}`;
  const crumbs = [
    { name: SITE.name, url: SITE.url },
    { name: "Docs", url: `${SITE.url}/docs` },
    ...(page.href === "/docs" ? [] : [{ name: page.title, url }]),
  ];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "TechArticle",
            headline: page.title,
            description: page.description,
            url,
            mainEntityOfPage: url,
            inLanguage: "en",
            image: `${SITE.url}/opengraph-image`,
            author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
            // A reference to the full entity on the home page. An inline SoftwareApplication stub here is
            // validated by Google as an app listing on its own, and fails for lacking offers/OS/category.
            about: { "@id": `${SITE.url}/#software` },
            isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
          },
        ],
      }}
    />
  );
}
