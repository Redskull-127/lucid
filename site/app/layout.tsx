import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";
import "./globals.css";

const head = Funnel_Display({ variable: "--font-head", subsets: ["latin"], display: "swap" });
const body = Funnel_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const code = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "lucid: one shared dream for every Claude",
    template: "%s – lucid",
  },
  description: SITE.description,
  applicationName: "lucid",
  authors: [{ name: SITE.author, url: SITE.authorUrl }],
  keywords: ["Claude Code", "plugin", "multi-agent", "subagents", "Agent Teams", "shared memory", "hooks"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "lucid",
    url: "/",
    title: "lucid: one shared dream for every Claude",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "lucid: one shared dream for every Claude",
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0a28" },
  ],
};

// Runs before first paint: apply a saved theme choice. Without one, CSS follows the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
