"""Self-check for bin/lucid. Run: python3 test_lucid.py"""
import importlib.machinery
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

LUCID = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bin", "lucid")
_loader = importlib.machinery.SourceFileLoader("lucid", LUCID)
mod = importlib.util.module_from_spec(importlib.util.spec_from_loader("lucid", _loader))
_loader.exec_module(mod)

root = tempfile.mkdtemp()
ENV = {k: v for k, v in os.environ.items() if k not in ("LUCID_ROOT", "LUCID_AGENT")}
ENV["CLAUDE_PROJECT_DIR"] = root


def run(*args, stdin=None, **env):
    return subprocess.run([sys.executable, LUCID, *args], input=stdin, capture_output=True,
                          text=True, cwd=root, env=dict(ENV, **env))


def hook(event, env=None, **inp):
    r = run("hook", event, stdin=json.dumps(dict(session_id="S1", cwd=root, **inp)), **(env or {}))
    assert r.returncode in (0, 2), r.stderr
    return r.returncode, (json.loads(r.stdout)["hookSpecificOutput"] if r.stdout.strip() else {})


def ctx(res):
    return res[1].get("additionalContext", "")


def edit(agent, f, env=None):
    return hook("PreToolUse", env, tool_name="Edit", tool_input={"file_path": os.path.join(root, f)}, **agent)[1]


A, B, C = ({"agent_id": "agent-" + x, "agent_type": "general-purpose"} for x in "abc")
a, b, c, main = mod.who(A), mod.who(B), mod.who(C), mod.who({"session_id": "S1"})
plan = os.path.join(root, ".lucid", "plan.md")

# inactive until the project opts in
assert hook("SessionStart") == (0, {})
assert run("note", "fact", "x").returncode != 0
assert run("init").returncode == 0
with open(plan, "w") as f:
    f.write("# Plan\n- build auth\n")

# everyone starts from the same dream, including a plan edited outside Claude
d = ctx(hook("SessionStart"))
assert "build auth" in d and main in d
for agent in (A, B, C):
    assert "build auth" in ctx(hook("SubagentStart", **agent))

# A's decision reaches main and B exactly once; A never gets its own note back
with open(os.path.join(root, "auth.py"), "w") as f:
    f.write("x = 1\n")
jwt = run("--as", a, "note", "decision", "use JWT", "-e", "auth.py:1").stdout.split()[0].lstrip("#")
assert "use JWT" in ctx(hook("UserPromptSubmit"))
assert ctx(hook("UserPromptSubmit")) == ""
assert "use JWT" not in ctx(hook("PreToolUse", tool_name="Read", tool_input={}, **A))
assert "use JWT" in ctx(hook("PreToolUse", tool_name="Read", tool_input={}, **B))

# a plan edit by A arrives at B as a diff before B's next tool call
with open(plan, "a") as f:
    f.write("- add OAuth\n")
hook("PostToolUse", tool_name="Edit", tool_input={"file_path": plan}, **A)
d = ctx(hook("PreToolUse", tool_name="Read", tool_input={}, **B))
assert "PLAN CHANGED by " + a in d and "+- add OAuth" in d and "overrides your original brief" in d, d

# file claims: owner may edit, everyone else is denied, overlapping claims are refused
assert run("--as", a, "claim", "db/**", "--for", "migrations").returncode == 0
assert run("--as", b, "claim", "db/x.py").returncode != 0
assert edit(B, "db/x.py").get("permissionDecision") == "deny"
assert "permissionDecision" not in edit(A, "db/x.py")
assert hook("PreToolUse", tool_name="Write", tool_input={"file_path": os.path.join(root, "db/y.py")})[1]["permissionDecision"] == "deny"
assert "permissionDecision" not in edit(B, "db/x.py", env={"LUCID_CLAIM_TTL": "0"})  # lapsed owner
assert edit(B, ".lucid/log.jsonl")["permissionDecision"] == "deny"

# every lucid call gets the caller's real id stamped on (missing or wrong --as), nothing is auto-approved
bash = lambda cmd: hook("PreToolUse", tool_name="Bash", tool_input={"command": cmd}, **B)[1]
r = bash("lucid note fact x")
assert r["updatedInput"]["command"] == "lucid --as %s note fact x" % b and "permissionDecision" not in r
assert bash("cd . && lucid --as w-pricing log")["updatedInput"]["command"] == "cd . && lucid --as %s log" % b
assert "updatedInput" not in bash("lucid --as %s log" % b)
assert "updatedInput" not in bash("grep lucid README")

# stop gate: an agent that edited but logged nothing is asked once; stopping releases claims
assert "permissionDecision" not in edit(C, "ui.py")
assert hook("SubagentStop", **C)[0] == 2
assert hook("SubagentStop", **C)[0] == 0
assert hook("SubagentStop", **A)[0] == 0
assert "permissionDecision" not in edit(B, "db/x.py")

# staleness, supersede, consolidated digest
with open(os.path.join(root, "auth.py"), "w") as f:
    f.write("x = 2\n")
s = run("--as", main, "status").stdout
assert "use JWT" in s and "⚠stale" in s, s
run("--as", main, "supersede", jwt, "--why", "switched to sessions")
assert "use JWT" not in run("--as", main, "status").stdout
run("--as", b, "note", "failed", "bcrypt native build breaks on node 24")
last = run("log").stdout.strip().splitlines()[-1].split()[-1]
with open(os.path.join(root, ".lucid", "digest.md"), "w") as f:
    f.write("<!-- lucid:upto=%s -->\nUse bcryptjs, not bcrypt.\n" % last)
s = run("--as", main, "status").stdout
assert "Use bcryptjs" in s and "bcrypt native" not in s, s

print("ok")
