"""A/B benchmark: the same Claude Code tasks with and without lucid.

  python3 bench/run.py --runs 5 -j 3     # appends to bench/results.jsonl
  python3 bench/chart.py                 # renders assets/bench-*.svg

Every run gets a fresh git repo and a `claude -p` session with project settings only (no user plugins,
hooks or CLAUDE.md). Every arm gets identical prompts and tools; the `lucid` arm only adds --plugin-dir
and `lucid init`. A hidden acceptance test, which the agents never see, scores the final code.

Team-rules scenarios (0.5) add arms: `md` (all 30 rules in one CLAUDE.md) and `native` (the same rules as
.claude/rules/ files, which Claude Code loads by path). `lucid` uses the very same rule files plus the plugin.
"""
import argparse
import concurrent.futures
import json
import os
import subprocess
import sys
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN = os.path.dirname(HERE)
TOOLS = "Agent,Read,Edit,Write,Glob,Grep,Skill,Bash(lucid:*),Bash(python3:*),Bash(ls:*),Bash(cat:*),Bash(echo:*),Bash(cd:*)"
ENV = {k: v for k, v in os.environ.items() if not k.startswith(("LUCID_", "CLAUDE_CODE_EXPERIMENTAL"))}

PRICING = 'PRICES = {"apple": 30, "pear": 50, "melon": 120}\n\n\ndef price(item):\n    return PRICES[item]\n'
CART = ("from shop.pricing import price\n\n\nclass Cart:\n    def __init__(self):\n        self.items = []\n\n"
        "    def add(self, item):\n        self.items.append(item)\n\n    def total(self):\n"
        "        return sum(price(i) for i in self.items)\n")
PLAN = ("# Plan\n\n## Tasks (one owner per file)\n"
        "- [ ] Worker 1 owns shop/pricing.py: add discount(price, pct) returning price reduced by pct percent (int, rounded down).\n"
        "- [ ] Worker 2 owns shop/cart.py: add Cart.remove(item) removing one occurrence of item.\n")
REPLAN = ("- [ ] CHANGE (from the user, mid-task): Cart.total() must apply discount(total, 10) from shop.pricing "
          "when the raw total is over 100. Owner: whoever owns shop/cart.py.\n")

SCENARIOS = {
    "replan-early": {"trigger": any,
        "prompts": ["Implement the tasks in PLAN.md. Spawn exactly two general-purpose subagents in parallel, one per "
                    "task, and wait for both. Tell each worker which task it owns and to follow PLAN.md. Report briefly."],
        "check": """
from shop.cart import Cart
from shop.pricing import discount
c = Cart(); c.add("apple"); c.add("pear"); c.add("apple"); c.remove("apple")
ok("discount", lambda: discount(200, 10) == 180)
ok("remove", lambda: c.items == ["pear", "apple"])
ok("total_small", lambda: c.total() == 80)
c.add("melon")
ok("replan_applied", lambda: c.total() == 180)
""",
    },
    "replan-late": {"trigger": all},  # filled in below: same task, plan changes after both main edits
    "memory": {
        "prompts": [
            "Add discount(price, pct) to shop/pricing.py, returning the price reduced by pct percent. Finance policy "
            "(not written down anywhere in this repo, and it applies to all future work here too): every money "
            "function returns whole integers rounded DOWN and raises ValueError for negative inputs.",
            "Add tax(price, rate_pct) to shop/pricing.py that returns the price including tax.",
        ],
        "check": """
from shop.pricing import tax
ok("tax_basic", lambda: tax(100, 10) == 110)
ok("policy_round_down_int", lambda: tax(101, 7) == 108 and isinstance(tax(101, 7), int))
def neg():
    try:
        tax(-5, 7)
    except ValueError:
        return True
    return False
ok("policy_rejects_negative", neg)
""",
    },
    "control": {
        "prompts": ["Add Cart.remove(item) to shop/cart.py that removes one occurrence of item."],
        "check": """
from shop.cart import Cart
c = Cart(); c.add("apple"); c.add("pear"); c.add("apple"); c.remove("apple")
ok("remove", lambda: c.items == ["pear", "apple"])
""",
    },
}

SCENARIOS["replan-late"] = dict(SCENARIOS["replan-early"], trigger=all)

# ---- team rules (0.5): 30 rules, 3 of which apply to the task; the prompt never mentions them ----
LOG = "def warn(msg):\n    pass\n\n\ndef info(msg):\n    pass\n"
RELEVANT = [  # (file, paths, lucid keys, text)
    ("shop/logging.md", ["shop/**"], "forbid: '\\bprint\\('\n",
     "# Log through shop.log, never print\nCode in shop/ reports problems with `shop.log.warn(msg)` or `shop.log.info(msg)`. "
     "Never call print(): this service's stdout is its JSON API stream."),
    ("shop/money.md", ["shop/**"], "review: true\n",
     "# Money functions reject negative amounts\nEvery function in shop/ that takes a price or an amount raises ValueError "
     "when it is negative."),
    ("shop/docstrings.md", ["shop/**/*.py"], "review: true\n",
     "# Every public function has a docstring\nEach public function and method in shop/ starts with a one-line docstring "
     "saying what it returns."),
]
OTHER = [(a, b) for a, b in (
    ("web/components", "Components use named exports, never default exports."), ("web/styles", "No inline styles; use the CSS modules next to the component."),
    ("web/hooks", "Custom hooks start with `use` and live in web/hooks/."), ("web/i18n", "Every user-facing string goes through t() from web/i18n."),
    ("web/a11y", "Every icon-only button has an aria-label."), ("web/images", "Images use the <Img> wrapper so they get lazy loading."),
    ("api/handlers", "Handlers return { data } or { error }, never a bare value."), ("api/auth", "Every route checks session.role before reading data."),
    ("api/pagination", "List endpoints paginate with a cursor, never an offset."), ("api/errors", "Throw ApiError(code, message); never throw strings."),
    ("api/timeouts", "Outbound HTTP calls set a 5 s timeout."), ("api/ids", "Ids in URLs are opaque strings, never database integers."),
    ("db/migrations", "Every migration has a down step."), ("db/queries", "No SELECT *; list the columns."),
    ("db/transactions", "Writes that touch two tables run in one transaction."), ("db/indexes", "A new foreign key gets an index in the same migration."),
    ("db/naming", "Tables are plural snake_case; columns singular snake_case."), ("infra/terraform", "Every resource carries owner and env tags."),
    ("infra/secrets", "Secrets come from the vault module, never from tfvars."), ("infra/docker", "Images pin a digest, not a tag."),
    ("scripts/shell", "Shell scripts start with `set -euo pipefail`."), ("docs/style", "Docs use sentence-case headings."),
    ("docs/links", "Link to code by path, never by line number."), ("tests/fixtures", "Fixtures live next to the test that uses them."),
    ("tests/time", "Tests freeze time with the clock fixture; never sleep."), ("tests/network", "Unit tests never touch the network."),
    ("mobile/navigation", "Screens register in mobile/routes.ts."))]


def rules_files(arm):
    if arm == "md":  # one big instruction file, the way most teams write it
        secs = ["## %s (applies to `%s`)\n%s" % (t.split("\n")[0][2:], ", ".join(ps), t.split("\n", 1)[1]) for _, ps, _, t in RELEVANT]
        secs += ["## %s (applies to `%s/**`)\n%s" % (b.split(";")[0].rstrip("."), p.split("/")[0], b) for p, b in OTHER]
        return {"CLAUDE.md": "# Team rules\n\n" + "\n\n".join(secs) + "\n"}
    files = {"CLAUDE.md": "# shop\nTeam rules live in .claude/rules/.\n"}  # identical for native and lucid: the plugin is the only difference
    for f, ps, keys, t in RELEVANT:
        files[".claude/rules/" + f] = "---\npaths: [%s]\n%s---\n%s\n" % (", ".join('"%s"' % x for x in ps), keys, t)
    for p, b in OTHER:
        files[".claude/rules/%s.md" % p] = "---\npaths: [\"%s/**\"]\n---\n# %s\n%s\n" % (p.split("/")[0], b.split(";")[0].rstrip("."), b)
    return files


RULES_TASK = ("Implement these in the shop package:\n1. discount(price, pct) in shop/pricing.py: the price reduced by pct percent, "
              "rounded down to an int.\n2. Cart.remove(item) in shop/cart.py: remove one occurrence of item.\n3. Cart.count(item) "
              "in shop/cart.py: how many times item is in the cart.\n4. Cart.add(item) should report a warning when the item has "
              "no price in PRICES, but still add it.\nReport briefly.")
RULES_CHECK = """
import contextlib, io
import shop.log as L
calls = []
L.warn = L.info = lambda *a, **k: calls.append(a)
import shop.pricing as P
from shop.cart import Cart
c = Cart(); c.add("apple"); c.add("pear"); c.add("apple"); c.remove("apple")
ok("task_discount", lambda: P.discount(200, 10) == 180)
ok("task_remove", lambda: c.items == ["pear", "apple"])
ok("task_count", lambda: c.count("apple") == 1)
out, err = io.StringIO(), io.StringIO()
with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
    c.add("kiwi")
ok("task_warns", lambda: "kiwi" in c.items and bool(calls or out.getvalue() or err.getvalue()))
src = open("shop/cart.py").read() + open("shop/pricing.py").read()
ok("rule_log_not_print", lambda: bool(calls) and out.getvalue() == "" and "print(" not in src)
def neg():
    try:
        P.discount(-5, 10)
    except ValueError:
        return True
    return False
ok("rule_negative", neg)
ok("rule_docstrings", lambda: all((f.__doc__ or "").strip() for f in (P.discount, Cart.remove, Cart.count)))
"""
SCENARIOS["rules"] = {"arms": ("lucid", "native", "md"), "files": rules_files, "prompts": [RULES_TASK], "check": RULES_CHECK}
SCENARIOS["rules-control"] = {"arms": ("lucid", "native"), "files": rules_files, "prompts": SCENARIOS["control"]["prompts"],
                              "check": SCENARIOS["control"]["check"]}
# A teammate's session: same repo, none of session 1's machine-local auto memory. lucid isn't set up beforehand (no
# `lucid init`): this also tests that Claude reaches for `lucid learn` unprompted. Between sessions the team "merges
# the PR": proposals move into .claude/rules/. Whatever the baseline wrote into the repo (a CLAUDE.md) stays too.
# Long session (pre-registered before any run, 2026-11-18): research finds agents slip as sessions get longer, so the
# shop rules apply in turns 1, 6 and 7 of ONE continued session, with unrelated work and a context-heavy turn between.
# Same 30 rules and the same three arms as `rules`; pass = every task and every rule on every new shop function.
STEPS = [("validates", "auth"), ("caches", "storage"), ("retries", "queue"), ("logs", "metrics"), ("batches", "billing")] * 3
DOCS = {"docs/%s.md" % n: "# %s\n\n" % n.title() + "\n\n".join(
    "## %s %d\n%s" % (n.title(), k, " ".join("The %s service %s step %d of request %d, then hands off to the %s layer."
                                             % (n, v, k, j, w) for j, (v, w) in enumerate(STEPS)))
    for k in range(12)) + "\n" for n in ("gateway", "billing", "search", "notifications", "storage")}
LONG_TURNS = [
    "Add discount(price, pct) to shop/pricing.py: the price reduced by pct percent, rounded down to an int. Report briefly.",
    "Create web/components/Button.tsx: a small React button that takes label and onClick. Report briefly.",
    "Create db/migrations/001_users.sql creating a users table with id, email and created_at. Report briefly.",
    "Read every file in docs/ and write docs/SUMMARY.md: a 10-line summary of how the system fits together. Report briefly.",
    "Create infra/main.tf with one S3 bucket for uploads. Report briefly.",
    "In shop/cart.py add Cart.remove(item), removing one occurrence, and Cart.count(item). Also, Cart.add(item) should "
    "report a warning when the item has no price in PRICES, but still add it. Report briefly.",
    "Add refund(amount, pct) to shop/pricing.py: the part of amount refunded at pct percent, rounded down to an int. "
    "Report briefly.",
]
LONG_CHECK = RULES_CHECK.replace('ok("rule_negative", neg)', """ok("task_refund", lambda: P.refund(200, 10) == 20)
def neg_refund():
    try:
        P.refund(-5, 10)
    except ValueError:
        return True
    return False
ok("rule_negative", lambda: neg() and neg_refund())""").replace(
    "(P.discount, Cart.remove, Cart.count)", "(P.discount, P.refund, Cart.remove, Cart.count)")
SCENARIOS["rules-long"] = {"arms": ("lucid", "native", "md"), "files": lambda arm: dict(rules_files(arm), **DOCS),
                           "prompts": LONG_TURNS, "continue": True, "check": LONG_CHECK}
TEAMMATE = {"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"}
SCENARIOS["teammate"] = {"init": False, "check": SCENARIOS["memory"]["check"], "prompts": [
    "Add discount(price, pct) to shop/pricing.py, returning the price reduced by pct percent. From now on this is team "
    "policy for everyone working in this repo, not just this task: every money function returns whole integers rounded "
    "DOWN and raises ValueError for negative inputs.",
    ("Add tax(price, rate_pct) to shop/pricing.py that returns the price including tax.", TEAMMATE)]}


def merge_proposals(d):
    src = os.path.join(d, ".lucid", "proposed")
    names = sorted(os.listdir(src)) if os.path.isdir(src) else []
    os.makedirs(os.path.join(d, ".claude", "rules"), exist_ok=True)
    for n in names:
        os.replace(os.path.join(src, n), os.path.join(d, ".claude", "rules", n))
    return len(names)

CHECK_HEADER = """
import json
res = {}
def ok(name, fn):
    try:
        res[name] = bool(fn())
    except Exception:
        res[name] = False
try:
%s
except Exception as ex:
    res["import_error"] = False
print(json.dumps(res))
"""


def sh(cmd, cwd, **kw):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=ENV, **kw)


def make_repo(scenario, arm):
    d = tempfile.mkdtemp(prefix="lucidbench-%s-%s-" % (scenario, arm))
    os.makedirs(os.path.join(d, "shop"))
    for name, text in (("shop/__init__.py", ""), ("shop/pricing.py", PRICING), ("shop/cart.py", CART)):
        with open(os.path.join(d, name), "w") as f:
            f.write(text)
    if scenario.startswith("replan"):
        with open(os.path.join(d, "PLAN.md"), "w") as f:
            f.write(PLAN)
    extra = SCENARIOS[scenario].get("files")
    for name, text in (dict(extra(arm), **{"shop/log.py": LOG}) if extra else {}).items():
        os.makedirs(os.path.dirname(os.path.join(d, name)), exist_ok=True)
        with open(os.path.join(d, name), "w") as f:
            f.write(text)
    sh(["git", "init", "-q"], d)
    sh(["git", "-c", "user.email=b@b", "-c", "user.name=b", "add", "-A"], d)
    sh(["git", "-c", "user.email=b@b", "-c", "user.name=b", "commit", "-qm", "init"], d)
    if arm == "lucid" and SCENARIOS[scenario].get("init", True):
        lucid = [sys.executable, os.path.join(PLUGIN, "bin", "lucid")]
        sh(lucid + ["init"], d)
        if scenario.startswith("replan"):  # one plan file for both arms: lucid tracks PLAN.md through a symlink
            dream = sh(lucid + ["dream", "path"], d).stdout.strip()  # this branch's dream, .lucid/dreams/<branch>/
            os.remove(os.path.join(dream, "plan.md"))
            os.symlink(os.path.join(d, "PLAN.md"), os.path.join(dream, "plan.md"))
            with open(os.path.join(dream, ".plan.prev"), "w") as f:
                f.write(PLAN)
    return d


def claude(d, prompt, arm, env=None, cont=False):
    cmd = ["claude", "-p", "--model", ARGS.model, "--setting-sources", "project", "--output-format", "json",
           "--allowedTools", TOOLS] + (["--continue"] if cont else [])
    if arm == "lucid":
        cmd += ["--plugin-dir", PLUGIN]
    t0 = time.time()
    r = subprocess.run(cmd, input=prompt, cwd=d, capture_output=True, text=True, env=dict(ENV, **(env or {})), timeout=900)
    try:
        out = json.loads(r.stdout)
    except ValueError:
        return {"error": (r.stderr or r.stdout)[-300:], "wall_s": time.time() - t0}
    tokens = sum(sum(v.get(k, 0) for k in ("inputTokens", "outputTokens", "cacheReadInputTokens", "cacheCreationInputTokens"))
                 for v in (out.get("modelUsage") or {}).values())
    return {"cost": out.get("total_cost_usd", 0), "turns": out.get("num_turns", 0), "tokens": tokens,
            "wall_s": time.time() - t0, "error": out.get("is_error") and out.get("result", "")[-300:]}


def replan_trigger(d, stop, info, when):
    """Edit PLAN.md while workers are mid-task: at the first source edit (early) or once both files changed (late)."""
    files = [os.path.join(d, "shop", f) for f in ("cart.py", "pricing.py")]
    start = [os.path.getmtime(f) for f in files]
    t0 = time.time()
    while not stop.is_set():
        if when(os.path.getmtime(f) != m for f, m in zip(files, start)):
            with open(os.path.join(d, "PLAN.md"), "a") as f:
                f.write(REPLAN)
            info["replan_at_s"] = round(time.time() - t0, 1)
            return
        time.sleep(0.2)


SPENT, SPENT_LOCK = [0.0], threading.Lock()


def run_one(scenario, arm, i):
    if SPENT[0] >= ARGS.budget:  # hard cap: stop launching runs once the budget is spent
        return None
    d = make_repo(scenario, arm)
    stop, info = threading.Event(), {}
    if scenario.startswith("replan"):
        threading.Thread(target=replan_trigger, args=(d, stop, info, SCENARIOS[scenario]["trigger"]), daemon=True).start()
    res = {"scenario": scenario, "arm": arm, "run": i, "model": ARGS.model, "cost": 0.0, "turns": 0, "tokens": 0, "wall_s": 0.0}
    for k, prompt in enumerate(SCENARIOS[scenario]["prompts"]):  # memory: two separate sessions, nothing carried but the repo
        prompt, env = prompt if isinstance(prompt, tuple) else (prompt, None)
        if scenario == "teammate" and k == 1 and arm == "lucid":
            res["merged_proposals"] = merge_proposals(d)
        r = claude(d, prompt, arm, env, cont=k > 0 and SCENARIOS[scenario].get("continue", False))
        for k in ("cost", "turns", "tokens", "wall_s"):
            res[k] += r.get(k, 0) or 0
        with SPENT_LOCK:
            SPENT[0] += r.get("cost", 0) or 0
        if r.get("error"):
            res["error"] = r["error"]
    stop.set()
    body = "\n".join("    " + line for line in SCENARIOS[scenario]["check"].strip().splitlines())
    chk = sh([sys.executable, "-c", CHECK_HEADER % body], d, timeout=60)
    try:
        res["checks"] = json.loads(chk.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        res["checks"] = {"crashed": False}
    res["pass"] = bool(res["checks"]) and all(res["checks"].values())
    res.update(info)
    res["_dir"] = d  # printed for failures, never written
    if scenario.startswith("replan") and "replan_at_s" not in info:
        res["note"] = "workers never edited; replan not triggered"
    return res


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=5)
    ap.add_argument("-j", type=int, default=3)
    ap.add_argument("--model", default="haiku")
    ap.add_argument("--scenarios", default="replan-early,replan-late,memory,control")
    ap.add_argument("--out", default=os.path.join(HERE, "results.jsonl"))
    ap.add_argument("--budget", type=float, default=float("inf"), help="USD; no new runs start once spent")
    ARGS = ap.parse_args()
    jobs = [(s, arm, i) for i in range(ARGS.runs) for s in ARGS.scenarios.split(",")
            for arm in SCENARIOS[s].get("arms", ("lucid", "baseline"))]
    with concurrent.futures.ThreadPoolExecutor(ARGS.j) as pool, open(ARGS.out, "a") as out:
        for fut in concurrent.futures.as_completed([pool.submit(run_one, *j) for j in jobs]):
            r = fut.result()
            if r is None:
                continue
            d = r.pop("_dir")
            out.write(json.dumps(r) + "\n")
            out.flush()
            print("%-8s %-8s #%d pass=%-5s $%.3f %4.0fs %s" % (r["scenario"], r["arm"], r["run"], r["pass"], r["cost"],
                                                               r["wall_s"], r.get("error") or r.get("note") or r["checks"]),
                  "" if r["pass"] else d, flush=True)
