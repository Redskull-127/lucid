import { DOC_GROUPS } from "@/lib/docs";
import { INSTALL, SITE } from "@/lib/site";

/*
  /llms.txt (llmstxt.org): a Markdown map of the site for LLMs and answer engines. It's built from the same
  page list as the docs sidebar, so it can't drift. Every fact below is from the README's benchmark sections.
*/
export function GET() {
  const docs = DOC_GROUPS.flatMap((g) => [
    `## ${g.title}`,
    "",
    ...g.pages.map((p) => `- [${p.title}](${SITE.url}${p.href}): ${p.description}`),
    "",
  ]);
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "lucid is free and open source (MIT). It needs only Python 3.9+ (standard library) and runs on macOS and Linux. Install it inside Claude Code:",
    "",
    "```",
    INSTALL.marketplace,
    INSTALL.install,
    "```",
    "",
    "Key facts:",
    "- A plan change made mid-build reaches every running agent (the lead, subagents, Agent-Teams teammates) before its next tool call, as a diff injected by hooks.",
    "- Benchmark, Claude Haiku 5.5 and Opus 5.5, two codebases: when the plan changed mid-build, runs passed 54/54 with lucid and 12/54 without.",
    "- Per passing run on Opus 5.5, lucid cost $1.01 vs $4.57 without it (runs without lucid kept missing the change).",
    "- With nothing to coordinate, the overhead was +$0.002 per run on Haiku.",
    "- Team rules live in .claude/rules/*.md. lucid checks each edit's added lines against `forbid` patterns, asks for a review against `review: true` rules before a turn ends, and turns corrections and PR reviews into proposed rules a PR approves. Its benchmark found no rule-adherence gain over native rules (every arm followed every rule); what it adds is the check, a record of what each rule caught, and the path from correction to rule.",
    "",
    ...docs,
    "## Optional",
    "",
    "- [README](https://raw.githubusercontent.com/Redskull-127/lucid/main/README.md): the full documentation in one Markdown file, with every benchmark table",
    `- [Source on GitHub](${SITE.github})`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
