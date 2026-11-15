import type { MetadataRoute } from "next";
import { DOC_PAGES } from "@/lib/docs";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: "monthly", priority: 1 },
    ...DOC_PAGES.map((p) => ({
      url: `${SITE.url}${p.href}`,
      changeFrequency: "monthly" as const,
      priority: p.href === "/docs" ? 0.8 : 0.6,
    })),
  ];
}
