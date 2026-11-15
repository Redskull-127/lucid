"""A/B benchmark: the same Claude Code tasks with and without lucid.

  python3 bench/run.py --runs 5 -j 3     # appends to bench/results.jsonl
  python3 bench/chart.py                 # renders assets/bench-*.svg

Every run gets a fresh git repo and a `claude -p` session with project settings only (no user plugins,
hooks or CLAUDE.md). Both arms get identical prompts and tools; the `lucid` arm only adds --plugin-dir
and `lucid init`. A hidden acceptance test, which the agents never see, scores the final code.
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
    sh(["git", "init", "-q"], d)
    sh(["git", "-c", "user.email=b@b", "-c", "user.name=b", "add", "-A"], d)
    sh(["git", "-c", "user.email=b@b", "-c", "user.name=b", "commit", "-qm", "init"], d)
    if arm == "lucid":
        sh([sys.executable, os.path.join(PLUGIN, "bin", "lucid"), "init"], d)
        if scenario.startswith("replan"):  # one plan file for both arms: lucid tracks PLAN.md through a symlink
            os.remove(os.path.join(d, ".lucid", "plan.md"))
            os.symlink("../PLAN.md", os.path.join(d, ".lucid", "plan.md"))
            with open(os.path.join(d, ".lucid", ".plan.prev"), "w") as f:
                f.write(PLAN)
    return d


def claude(d, prompt, arm):
    cmd = ["claude", "-p", "--model", ARGS.model, "--setting-sources", "project", "--output-format", "json",
           "--allowedTools", TOOLS]
    if arm == "lucid":
        cmd += ["--plugin-dir", PLUGIN]
    t0 = time.time()
    r = subprocess.run(cmd, input=prompt, cwd=d, capture_output=True, text=True, env=ENV, timeout=900)
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


def run_one(scenario, arm, i):
    d = make_repo(scenario, arm)
    stop, info = threading.Event(), {}
    if scenario.startswith("replan"):
        threading.Thread(target=replan_trigger, args=(d, stop, info, SCENARIOS[scenario]["trigger"]), daemon=True).start()
    res = {"scenario": scenario, "arm": arm, "run": i, "model": ARGS.model, "cost": 0.0, "turns": 0, "tokens": 0, "wall_s": 0.0}
    for prompt in SCENARIOS[scenario]["prompts"]:  # memory: two separate sessions, nothing carried but the repo
        r = claude(d, prompt, arm)
        for k in ("cost", "turns", "tokens", "wall_s"):
            res[k] += r.get(k, 0) or 0
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
    res.update(info, dir=d)
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
    ARGS = ap.parse_args()
    jobs = [(s, arm, i) for i in range(ARGS.runs) for s in ARGS.scenarios.split(",") for arm in ("lucid", "baseline")]
    with concurrent.futures.ThreadPoolExecutor(ARGS.j) as pool, open(ARGS.out, "a") as out:
        for fut in concurrent.futures.as_completed([pool.submit(run_one, *j) for j in jobs]):
            r = fut.result()
            out.write(json.dumps(r) + "\n")
            out.flush()
            print("%-8s %-8s #%d pass=%-5s $%.3f %4.0fs %s" % (r["scenario"], r["arm"], r["run"], r["pass"], r["cost"],
                                                               r["wall_s"], r.get("error") or r.get("note") or r["checks"]),
                  flush=True)
