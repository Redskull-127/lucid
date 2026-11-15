"""Render bench/results.jsonl into README charts: assets/bench-{success,cost,time}-{light,dark}.svg

  python3 bench/chart.py            # also prints the markdown results table
"""
import json
import math
import os
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets")
# dataviz reference palette; categorical slots 1-2 validated together in both modes
THEMES = {
    "light": dict(surface="#fcfcfb", ink="#0b0b0b", ink2="#52514e", muted="#898781", grid="#e1e0d9",
                  series=("#2a78d6", "#eb6834")),
    "dark": dict(surface="#1a1a19", ink="#f0efec", ink2="#c3c2b7", muted="#898781", grid="#2c2c2a",
                 series=("#3987e5", "#d95926")),
}
ARMS = (("lucid", "with lucid"), ("baseline", "without"))
SCENARIOS = (
    ("replan-early", "Plan changes early", "while both workers are mid-task"),
    ("replan-late", "Plan changes late", "after both workers' main edits"),
    ("memory", "Policy in a new session", "single agent; parity check"),
    ("control", "Simple task", "nothing to coordinate: overhead"),
)
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"


def load():
    rows = [json.loads(l) for l in open(os.path.join(HERE, "results.jsonl"))]
    stats = {}
    for sc, *_ in SCENARIOS:
        for arm, _ in ARMS:
            rs = [r for r in rows if r["scenario"] == sc and r["arm"] == arm]
            if rs:
                stats[sc, arm] = dict(n=len(rs), passed=sum(r["pass"] for r in rs),
                                      cost=[r["cost"] for r in rs], time=[r["wall_s"] for r in rs],
                                      tokens=[r["tokens"] for r in rs])
    return rows, stats


def nice_max(v):
    if v <= 0:
        return 1, 0.25
    mag = 10 ** math.floor(math.log10(v))
    for step in (0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10):
        if v / (step * mag) <= 5:
            return math.ceil(v / (step * mag)) * step * mag, step * mag


def bar(x0, y, w, h, color):
    if w <= 0:
        return ""
    r = min(4, w, h / 2)  # 4px rounded data-end, square at the baseline
    return ('<path d="M%.1f %.1fH%.1fQ%.1f %.1f %.1f %.1fV%.1fQ%.1f %.1f %.1f %.1fH%.1fZ" fill="%s"/>'
            % (x0, y, x0 + w - r, x0 + w, y, x0 + w, y + r, y + h - r, x0 + w, y + h, x0 + w - r, y + h, x0, color))


def chart(metric, title, subtitle, value, spread, label, axis_fmt, maximum, theme):
    t = THEMES[theme]
    W, X0, RH, TOP = 760, 236, 54, 104
    PW = W - X0 - 96
    H = TOP + RH * len(SCENARIOS) + 34
    top, step = (100, 25) if maximum is None else nice_max(maximum)
    sx = lambda v: X0 + PW * v / top
    o = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" font-family="%s">'
         % (W, H, W, H, FONT)]
    desc = "; ".join("%s: %s" % (s[1], ", ".join("%s %s" % (lab, label(STATS[s[0], arm]))
                                                    for arm, lab in ARMS if (s[0], arm) in STATS)) for s in SCENARIOS)
    o.append("<title>%s</title><desc>%s</desc>" % (title, desc))
    o.append('<rect width="%d" height="%d" rx="10" fill="%s"/>' % (W, H, t["surface"]))
    o.append('<text x="24" y="34" font-size="16" font-weight="600" fill="%s">%s</text>' % (t["ink"], title))
    o.append('<text x="24" y="55" font-size="12" fill="%s">%s</text>' % (t["ink2"], subtitle))
    lx = 24
    for (arm, lab), color in zip(ARMS, t["series"]):  # legend: always present for 2 series
        o.append('<rect x="%d" y="70" width="10" height="10" rx="2" fill="%s"/>' % (lx, color))
        o.append('<text x="%d" y="79" font-size="12" fill="%s">%s</text>' % (lx + 16, t["ink2"], lab))
        lx += 16 + 7 * len(lab) + 22
    v = 0
    while v <= top + 1e-9:  # hairline grid + ticks
        x = sx(v)
        o.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="1"/>' % (x, TOP - 8, x, H - 30, t["grid"]))
        o.append('<text x="%.1f" y="%d" font-size="11" fill="%s" text-anchor="middle">%s</text>' % (x, H - 14, t["muted"], axis_fmt(v)))
        v += step
    for i, (sc, name, sub) in enumerate(SCENARIOS):
        y = TOP + i * RH
        o.append('<text x="24" y="%d" font-size="13" font-weight="500" fill="%s">%s</text>' % (y + 19, t["ink"], name))
        o.append('<text x="24" y="%d" font-size="11" fill="%s">%s</text>' % (y + 35, t["muted"], sub))
        for j, ((arm, _), color) in enumerate(zip(ARMS, t["series"])):
            s = STATS.get((sc, arm))
            if not s:
                continue
            by = y + 6 + j * 16  # 14px bars, 2px surface gap between the pair
            end = sx(value(s))
            o.append(bar(X0, by, end - X0, 14, color))
            tip = end
            if spread:  # min-max whisker across runs, in ink (not data color)
                lo, hi = spread(s)
                o.append('<path d="M%.1f %.1fH%.1fM%.1f %.1fv8M%.1f %.1fv8" stroke="%s" stroke-width="1" fill="none" opacity="0.8"/>'
                         % (sx(lo), by + 7, sx(hi), sx(lo), by + 3, sx(hi), by + 3, t["ink2"]))
                tip = max(end, sx(hi))
            o.append('<text x="%.1f" y="%.1f" font-size="12" fill="%s" style="font-variant-numeric:tabular-nums">%s</text>'
                     % (tip + 6, by + 11, t["ink2"], label(s)))
    o.append("</svg>")
    path = os.path.join(OUT, "bench-%s-%s.svg" % (metric, theme))
    with open(path, "w") as f:
        f.write("\n".join(o) + "\n")
    return path


if __name__ == "__main__":
    ROWS, STATS = load()
    model = sorted({{"haiku": "Haiku 5.5", "sonnet": "Sonnet 5.5", "opus": "Opus 5.5"}.get(r["model"], r["model"]) for r in ROWS})
    ns = sorted({s["n"] for s in STATS.values()})
    meta = "%s · %s runs per arm" % ("/".join(model), "–".join(map(str, (ns[0], ns[-1]))) if len(ns) > 1 else ns[0])
    mean = statistics.mean
    for theme in THEMES:
        chart("success", "Task success: hidden acceptance test passed", meta + " · identical prompts; only the plugin differs",
              lambda s: 100 * s["passed"] / s["n"], None,
              lambda s: "%d%%  (%d/%d)" % (round(100 * s["passed"] / s["n"]), s["passed"], s["n"]),
              lambda v: "%d%%" % v, None, theme)
        chart("cost", "Cost per run (USD, all agents)", meta + " · bar = mean, whisker = min–max",
              lambda s: mean(s["cost"]), lambda s: (min(s["cost"]), max(s["cost"])),
              lambda s: "$%.3f" % mean(s["cost"]), lambda v: "$%.2f" % v,
              max(max(s["cost"]) for s in STATS.values()), theme)
        per_pass = lambda s: sum(s["cost"]) / s["passed"] if s["passed"] else 0
        chart("costpass", "Cost per passing run (USD): total spend ÷ runs that worked", meta + " · lower is better",
              per_pass, None, lambda s: "$%.3f" % per_pass(s) if s["passed"] else "no run passed",
              lambda v: "$%.2f" % v, max(per_pass(s) for s in STATS.values()), theme)
        chart("time", "Wall-clock time per run (seconds)", meta + " · bar = mean, whisker = min–max",
              lambda s: mean(s["time"]), lambda s: (min(s["time"]), max(s["time"])),
              lambda s: "%.0f s" % mean(s["time"]), lambda v: "%d" % v,
              max(max(s["time"]) for s in STATS.values()), theme)
    print("| Scenario | Arm | Success | Mean cost | Mean time | Mean tokens |\n|---|---|---|---|---|---|")
    for sc, name, _ in SCENARIOS:
        for arm, lab in ARMS:
            s = STATS.get((sc, arm))
            if s:
                print("| %s | %s | %d/%d | $%.3f | %.0f s | %s |" % (name, lab, s["passed"], s["n"], mean(s["cost"]),
                                                                  mean(s["time"]), format(int(mean(s["tokens"])), ",")))
