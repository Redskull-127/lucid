export type DocPage = {
  href: string;
  title: string;
  description: string;
};

export type DocGroup = {
  title: string;
  pages: DocPage[];
};

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Get started",
    pages: [
      {
        href: "/docs",
        title: "Overview",
        description: "What lucid is, what it keeps in .lucid/, and where to go next.",
      },
      {
        href: "/docs/installation",
        title: "Installation",
        description: "Install lucid from the marketplace or a local checkout, then turn it on per project.",
      },
      {
        href: "/docs/quick-start",
        title: "Quick start",
        description: "Five steps from lucid init to a consolidated dream.",
      },
    ],
  },
  {
    title: "Use lucid",
    pages: [
      {
        href: "/docs/commands",
        title: "Commands",
        description: "The /lucid:swarm, /lucid:replan and /lucid:dream slash commands, and the protocol skill.",
      },
      {
        href: "/docs/team-rules",
        title: "Team rules",
        description: "One versioned source of truth for how agents work: rules checked on every edit, learned from corrections and PR reviews, approved in a PR.",
      },
      {
        href: "/docs/cli",
        title: "CLI reference",
        description: "Every lucid subcommand and flag, with examples.",
      },
    ],
  },
  {
    title: "Under the hood",
    pages: [
      {
        href: "/docs/how-it-works",
        title: "How it works",
        description: "Hooks, digest and delta, claims, stale facts, the stop gate and Bash write detection.",
      },
      {
        href: "/docs/agent-teams",
        title: "Agent Teams",
        description: "Using lucid with Claude Code’s experimental Agent Teams.",
      },
      {
        href: "/docs/configuration",
        title: "Configuration",
        description: "Environment variables and what to commit.",
      },
    ],
  },
  {
    title: "Results and help",
    pages: [
      {
        href: "/docs/benchmark",
        title: "Benchmark",
        description: "Methodology, results, every chart, how to reproduce, and caveats.",
      },
      {
        href: "/docs/limits",
        title: "Limits & FAQ",
        description: "What lucid does not do, and answers to common questions.",
      },
      {
        href: "/docs/troubleshooting",
        title: "Troubleshooting",
        description: "Debug logging, lucid status, claude --debug and common messages.",
      },
    ],
  },
];

export const DOC_PAGES: DocPage[] = DOC_GROUPS.flatMap((g) => g.pages);

export function getDoc(href: string): DocPage {
  const page = DOC_PAGES.find((p) => p.href === href);
  if (!page) throw new Error(`Unknown docs page: ${href}`);
  return page;
}
