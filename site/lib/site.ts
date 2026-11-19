export const SITE = {
  name: "lucid",
  url: "https://lucid.meertarbani.in",
  tagline: "One shared dream for every Claude",
  /** Meta description: what search results show, so under ~160 characters. */
  summary:
    "lucid is a free Claude Code plugin that gives parallel agents one live plan, shared memory and file locks, plus team rules checked on every edit.",
  description:
    "A Claude Code plugin that gives the lead agent, its subagents and Agent-Teams teammates one live plan, an evidence-backed memory and file claims. Change the plan partway through and every running worker sees the change before its next action. Plus team rules every agent is checked against, learned from corrections and PR reviews.",
  github: "https://github.com/Redskull-127/lucid",
  license: "https://github.com/Redskull-127/lucid/blob/main/LICENSE",
  author: "Meer Tarbani",
  authorUrl: "https://www.meertarbani.in",
} as const;

/** The promo on the homepage. The transcript is the voiceover, word for word (video/src/words.json). */
export const VIDEO = {
  title: "lucid in under a minute",
  src: "/video/lucid.mp4",
  poster: "/video/lucid-poster.jpg",
  duration: "PT58S",
  uploadDate: "2026-11-20",
  transcript:
    "Three Claude agents. One feature. Big brain. Then you change the plan… and your workers? Did NOT get the memo. Plan drift. Clobbered files. Amnesia after compact. Meet lucid. One shared dream for every Claude. Edit the plan, and every running agent gets the diff before its very next tool call. Plus file locks, and memory that survives compact. Your AGENTS.md? Just a suggestion. Forty turns in… who's checking? lucid is. Every edit, from every agent, checked against your rules. And it learns. Correct an agent once, and lucid turns it into a repo rule. Architecture. Security. Conventions. Approved in a PR, followed by every agent. The receipts? Up to 4.5 times cheaper per working result. Two commands. Zero dependencies. Go lucid.",
} as const;

export const INSTALL = {
  marketplace: "/plugin marketplace add Redskull-127/lucid",
  install: "/plugin install lucid@lucid",
} as const;
