"""Render the README's how-it-works diagram: assets/how-it-works-{light,dark}.svg  (python3 assets/diagram.py)

A static SVG instead of Mermaid: GitHub draws Mermaid in a lazy iframe whose zoom controls cover the right edge.
"""
import os

THEMES = {
    "light": dict(bg="#fcfcfb", ink="#0b0b0b", ink2="#52514e", muted="#898781", line="#52514e", box="#ffffff",
                  border="#d6d5ce", dream="#eef4fc", dream_border="#86b6ef", accent="#2a78d6"),
    "dark": dict(bg="#1a1a19", ink="#f0efec", ink2="#c3c2b7", muted="#898781", line="#c3c2b7", box="#232322",
                 border="#3a3a37", dream="#14233a", dream_border="#256abf", accent="#3987e5"),
}
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="880" height="344" viewBox="0 0 880 344" font-family="{font}">
<title>How lucid works</title>
<desc>You edit the plan. The .lucid folder holds plan.md and log.jsonl. Hooks inject the full digest into every agent at start
and only what changed before each tool call. Agents write back with lucid note and lucid claim.</desc>
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
<path d="M0 0L10 5L0 10z" fill="{line}"/></marker>
<marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
<path d="M0 0L10 5L0 10z" fill="{accent}"/></marker></defs>
<rect width="880" height="344" rx="12" fill="{bg}"/>

<rect x="24" y="72" width="132" height="44" rx="22" fill="{box}" stroke="{border}"/>
<text x="90" y="99" font-size="14" font-weight="600" fill="{ink}" text-anchor="middle">You</text>
<path d="M156 94H274" stroke="{line}" stroke-width="1.5" fill="none" marker-end="url(#a)"/>
<text x="215" y="84" font-size="11" fill="{ink2}" text-anchor="middle">edit the plan</text>
<text x="215" y="112" font-size="11" fill="{muted}" text-anchor="middle">/lucid:replan</text>

<rect x="276" y="20" width="300" height="304" rx="12" fill="{dream}" stroke="{dream_border}"/>
<text x="296" y="46" font-size="13" font-weight="600" fill="{ink}">.lucid/</text>
<text x="347" y="46" font-size="12" fill="{ink2}">the shared dream</text>
<rect x="296" y="62" width="260" height="64" rx="8" fill="{box}" stroke="{border}"/>
<text x="312" y="87" font-size="14" font-weight="600" fill="{ink}">plan.md</text>
<text x="312" y="108" font-size="11.5" fill="{ink2}">the live plan; every edit becomes a diff</text>
<rect x="296" y="142" width="260" height="164" rx="8" fill="{box}" stroke="{border}"/>
<text x="312" y="167" font-size="14" font-weight="600" fill="{ink}">log.jsonl</text>
<text x="312" y="189" font-size="11.5" fill="{muted}">append-only, shared by every agent</text>
<g font-size="12" fill="{ink2}">
<text x="312" y="215">· decisions, with the why</text>
<text x="312" y="237">· facts, with path:line evidence</text>
<text x="312" y="259">· dead ends, so nobody retries</text>
<text x="312" y="281">· blockers and file claims</text>
</g>

<g font-size="13.5" font-weight="600" fill="{ink}" text-anchor="middle">
<rect x="716" y="62" width="140" height="44" rx="8" fill="{box}" stroke="{border}"/><text x="786" y="89">Lead agent</text>
<rect x="716" y="122" width="140" height="44" rx="8" fill="{box}" stroke="{border}"/><text x="786" y="149">Subagents</text>
<rect x="716" y="182" width="140" height="44" rx="8" fill="{box}" stroke="{border}"/><text x="786" y="209">Teammates</text>
</g>
<g stroke="{accent}" stroke-width="2" fill="none">
<path d="M576 84H714" marker-end="url(#b)"/><path d="M576 144H714" marker-end="url(#b)"/><path d="M576 204H714" marker-end="url(#b)"/>
</g>
<g font-size="11" fill="{ink2}" text-anchor="middle">
<text x="645" y="60">on start: everything</text>
<text x="645" y="75">then: only what's new</text>
</g>
<path d="M748 226V284H560" stroke="{line}" stroke-width="1.5" fill="none" marker-end="url(#a)"/>
<text x="654" y="304" font-size="11" fill="{ink2}" text-anchor="middle">lucid note · lucid claim</text>
<text x="806" y="250" font-size="11" fill="{muted}" text-anchor="middle">claimed files are</text>
<text x="806" y="264" font-size="11" fill="{muted}" text-anchor="middle">locked for others</text>
</svg>
"""

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    for name, t in THEMES.items():
        with open(os.path.join(here, "how-it-works-%s.svg" % name), "w") as f:
            f.write(SVG.format(font=FONT, **t))
