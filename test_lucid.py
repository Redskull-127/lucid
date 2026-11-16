"""Self-check for lucid: behaviour, edge cases, concurrency, performance. Run: python3 test_lucid.py"""
import importlib.machinery
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
LUCID, GUARD = os.path.join(HERE, "bin", "lucid"), os.path.join(HERE, "hooks", "guard.sh")
_loader = importlib.machinery.SourceFileLoader("lucid", LUCID)
mod = importlib.util.module_from_spec(importlib.util.spec_from_loader("lucid", _loader))
_loader.exec_module(mod)
BASE_ENV = {k: v for k, v in os.environ.items() if not k.startswith(("LUCID_", "CLAUDE_"))}
GIT = ["git", "-c", "user.email=t@t", "-c", "user.name=t", "-c", "init.defaultBranch=main"]


class Project:
    """A temp project with lucid initialised; hooks are called the way guard.sh calls them."""

    def __init__(self, root=None, init=True):
        self.root = root or tempfile.mkdtemp()
        if init:
            assert self.cli("init").returncode == 0

    def cli(self, *args, cwd=None, **env):
        return subprocess.run([sys.executable, LUCID, *args], capture_output=True, text=True,
                              cwd=cwd or self.root, env=dict(BASE_ENV, **env))

    def hook(self, event, env=None, **inp):
        r = subprocess.run([sys.executable, LUCID, "hook", event], capture_output=True, text=True,
                           input=json.dumps(dict(dict(session_id="S1", cwd=self.root), **inp)),
                           env=dict(BASE_ENV, LUCID_ROOT=self.root, **(env or {})))
        assert r.returncode in (0, 2), r.stderr
        return r.returncode, (json.loads(r.stdout)["hookSpecificOutput"] if r.stdout.strip() else {})

    def ctx(self, event, **inp):
        return self.hook(event, **inp)[1].get("additionalContext", "")

    def edit(self, agent, f, env=None, tool="Edit"):
        return self.hook("PreToolUse", env, tool_name=tool, tool_input={"file_path": os.path.join(self.root, f)}, **agent)[1]

    def path(self, *parts):
        return os.path.join(self.root, *parts)

    def put(self, f, text):
        os.makedirs(os.path.dirname(self.path(f)), exist_ok=True)
        with open(self.path(f), "w") as fh:
            fh.write(text)


A, B, C, D = ({"agent_id": "agent-" + x, "agent_type": "general-purpose"} for x in "abcd")
a, b, c, d = (mod.who(x) for x in (A, B, C, D))
main = mod.who({"session_id": "S1"})

# ======================= core behaviour =======================
pr = Project(init=False)
assert pr.hook("SessionStart") == (0, {})                         # inactive until opted in
assert pr.cli("note", "fact", "x").returncode != 0
assert pr.cli("init").returncode == 0
assert "## Plan" not in pr.ctx("SessionStart")                   # untouched template costs no tokens
pr.put(".lucid/plan.md", "# Plan\n- build auth\n")
s = pr.ctx("SessionStart")
assert "build auth" in s and main in s
for ag in (A, B, C):
    assert "build auth" in pr.ctx("SubagentStart", **ag)

pr.put("auth.py", "x = 1\n")
pr.edit(A, "auth.py")                                            # a worker (it edits), not a reader
jwt = pr.cli("--as", a, "note", "decision", "use JWT", "-e", "auth.py:1").stdout.split()[0].lstrip("#")
assert "use JWT" in pr.ctx("UserPromptSubmit")
assert pr.ctx("UserPromptSubmit") == ""                          # delivered exactly once
read_tool = dict(tool_name="Read", tool_input={})
assert "use JWT" not in pr.ctx("PreToolUse", **read_tool, **A)    # never your own notes back
assert "use JWT" in pr.ctx("PreToolUse", **read_tool, **B)

with open(pr.path(".lucid/plan.md"), "a") as f:
    f.write("- add OAuth\n")
pr.hook("PostToolUse", tool_name="Edit", tool_input={"file_path": pr.path(".lucid/plan.md")}, **A)
s = pr.ctx("PreToolUse", **read_tool, **B)
assert "PLAN CHANGED by " + a in s and "+- add OAuth" in s and "overrides your original brief" in s, s

assert pr.cli("--as", a, "claim", "db/**", "--for", "migrations").returncode == 0
assert pr.cli("--as", b, "claim", "db/x.py").returncode != 0      # overlap refused
assert pr.edit(B, "db/x.py").get("permissionDecision") == "deny"
assert "permissionDecision" not in pr.edit(A, "db/x.py")
assert pr.edit({}, "db/y.py", tool="Write")["permissionDecision"] == "deny"
assert "permissionDecision" not in pr.edit(B, "db/x.py", env={"LUCID_CLAIM_TTL": "0"})  # lapsed owner
assert pr.edit(B, ".lucid/log.jsonl")["permissionDecision"] == "deny"

bash = lambda cmd, ag=B: pr.hook("PreToolUse", tool_name="Bash", tool_input={"command": cmd}, **ag)[1]
stamped = lambda cmd: bash(cmd).get("updatedInput", {}).get("command")
assert stamped("lucid note fact x") == "lucid --as %s note fact x" % b and "permissionDecision" not in bash("lucid log")
assert stamped("cd . && lucid --as w-pricing log") == "cd . && lucid --as %s log" % b
assert stamped("LUCID_X=1 lucid status") == "LUCID_X=1 lucid --as %s status" % b
assert stamped("echo $(lucid status) `lucid log`") == "echo $(lucid --as %s status) `lucid --as %s log`" % (b, b)
assert stamped("  lucid") == "  lucid --as %s" % b
for untouched in ("lucid --as %s log" % b, "grep -r lucid .", "cat lucid.txt", "./bin/lucid log", "pip install lucid-x", "mylucid note"):
    assert "updatedInput" not in bash(untouched), untouched

# writes through Bash respect claims too (seen live: a teammate edited via a python heredoc)
denied = lambda cmd: bash(cmd).get("permissionDecision") == "deny"
pr.cli("--as", a, "claim", "db/**")
for cmd in ("sed -i 's/a/b/' db/x.py", "echo hi > db/x.py", "echo hi >> ./db/x.py", "cat a | tee db/x.py",
            "cp a.py db/x.py", "rm -f db/x.py", "python3 - <<'EOF'\np = 'db/x.py'\nopen(p, 'w').write('x')\nEOF",
            "python3 -c \"open('db/x.py', 'w').write('1')\"", "echo x > %s" % pr.path("db", "x.py")):
    assert denied(cmd), cmd
for cmd in ("cat db/x.py", "grep x db/x.py 2>&1", "python3 -c 'import db'", "ls > /dev/null", "sed -n 1p db/x.py",
            "cp db/x.py /tmp/copy.py", "echo hi > notes.txt"):
    assert not denied(cmd), cmd
assert not bash("sed -i 's/a/b/' db/x.py", A).get("permissionDecision")          # the owner may
pr.cli("--as", a, "release", "db/**")
E = {"agent_id": "agent-e", "agent_type": "general-purpose"}
pr.hook("SubagentStart", **E)
bash("python3 - <<'EOF'\nopen('ui.py', 'w').write('x')\nEOF", E)                 # edited via Bash only...
assert pr.hook("SubagentStop", **E)[0] == 2                                      # ...still asked to log once

assert "permissionDecision" not in pr.edit(C, "ui.py")
assert pr.hook("SubagentStop", **C)[0] == 2                     # edited, logged nothing: asked once
assert pr.hook("SubagentStop", **C)[0] == 0
assert pr.hook("SubagentStop", **A)[0] == 0                     # logged: fine, and claims released
assert "permissionDecision" not in pr.edit(B, "db/x.py")
pr.edit(D, ".lucid/plan.md")                                    # an agent that only changed the plan
with open(pr.path(".lucid/plan.md"), "a") as f:
    f.write("- D's idea\n")
pr.hook("PostToolUse", tool_name="Edit", tool_input={"file_path": pr.path(".lucid/plan.md")}, **D)
assert pr.hook("SubagentStop", **D)[0] == 0                     # ...has reported; not nagged

pr.put("auth.py", "x = 2\n")
s = pr.cli("--as", main, "status").stdout
assert "use JWT" in s and "auth.py:1] ⚠stale" in s, s
pr.cli("--as", main, "supersede", jwt, "--why", "switched to sessions")
assert "use JWT" not in pr.cli("--as", main, "status").stdout
pr.cli("--as", b, "note", "failed", "bcrypt native build breaks on node 24")
last = pr.cli("log").stdout.strip().splitlines()[-1].split()[-1]
pr.put(".lucid/digest.md", "<!-- lucid:upto=%s -->\nUse bcryptjs, not bcrypt.\n" % last)
s = pr.cli("--as", main, "status").stdout
assert "Use bcryptjs" in s and "bcrypt native" not in s, s
# while workers hold claims, a user message reminds the lead to route plan changes through plan.md
pn = Project()
pn.hook("SessionStart")
assert "still working" not in pn.ctx("UserPromptSubmit")
pn.cli("--as", a, "claim", "x.py")
assert a + " still working" in pn.ctx("UserPromptSubmit")
pn.cli("--as", a, "release")
assert "still working" not in pn.ctx("UserPromptSubmit")

# a session that ends releases its claims, so the next session isn't blocked (found by the benchmark)
assert pr.cli("--as", main, "claim", "tax.py").returncode == 0
assert pr.edit({"session_id": "S2"}, "tax.py").get("permissionDecision") == "deny"
pr.hook("SessionEnd")
assert "permissionDecision" not in pr.edit({"session_id": "S2"}, "tax.py")
# ...and so does a session whose turn ended (split-pane teammates are separate sessions that go idle)
assert pr.cli("--as", main, "claim", "tax.py").returncode == 0
assert pr.edit({"session_id": "S2"}, "tax.py").get("permissionDecision") == "deny"
pr.hook("Stop")
assert "permissionDecision" not in pr.edit({"session_id": "S2"}, "tax.py")
print("core behaviour ok")

# ======================= edge cases =======================
# symlinked project root (macOS /tmp -> /private/tmp): claims and plan edits must still match
real = tempfile.mkdtemp()
link = real + "-link"
os.symlink(real, link)
pl = Project(link)
assert pl.cli("--as", a, "claim", "a.py").returncode == 0
pl.hook("SubagentStart", **A)
assert pl.hook("PreToolUse", tool_name="Edit", tool_input={"file_path": os.path.join(os.path.realpath(real), "a.py")}, **B)[1]["permissionDecision"] == "deny"
assert pl.hook("PreToolUse", tool_name="Edit", tool_input={"file_path": os.path.join(link, "a.py")}, **B)[1]["permissionDecision"] == "deny"
pl.hook("SessionStart")
with open(os.path.join(real, ".lucid", "plan.md"), "w") as f:
    f.write("# Plan\n- via symlink\n")
pl.hook("PostToolUse", tool_name="Write", tool_input={"file_path": os.path.join(os.path.realpath(real), ".lucid", "plan.md")}, **A)
assert "PLAN CHANGED by " + a in pl.ctx("UserPromptSubmit")

# claims typed as absolute paths, ./ paths, or from a subdirectory are stored root-relative
pg = Project()
os.makedirs(pg.path("x"))
assert pg.cli("--as", a, "claim", pg.path("x", "y.py"), "./z/*").returncode == 0
assert pg.cli("--as", a, "claim", "k.py", cwd=pg.path("x")).returncode == 0
pg.hook("SubagentStart", **A)
for f in ("x/y.py", "z/k.py", "x/k.py"):
    assert pg.edit(B, f).get("permissionDecision") == "deny", f
assert "permissionDecision" not in pg.edit(B, "k.py")

# guard.sh: launched in a subdirectory finds the dream; repos without lucid never start python
pgd = Project()
subprocess.run(GIT + ["init", "-q"], cwd=pgd.root)
os.makedirs(pgd.path("pkg", "deep"))
gh = lambda proj_dir: subprocess.run(["sh", GUARD, "SessionStart"], capture_output=True, text=True,
                                     input=json.dumps({"session_id": "S1", "cwd": proj_dir}),
                                     env=dict(BASE_ENV, CLAUDE_PROJECT_DIR=proj_dir))
assert "Shared dream" in gh(pgd.path("pkg", "deep")).stdout
plain = tempfile.mkdtemp()
subprocess.run(GIT + ["init", "-q"], cwd=plain)
t0 = time.time()
r = gh(plain)
assert r.returncode == 0 and r.stdout == "" and time.time() - t0 < 0.5

# git worktrees share the main checkout's dream, even when .lucid/ was committed into the worktree
pw = Project()
subprocess.run(GIT + ["init", "-q"], cwd=pw.root)
pw.put("app.py", "x = 1\n")
subprocess.run(GIT + ["add", "-A"], cwd=pw.root)
subprocess.run(GIT + ["commit", "-qm", "init"], cwd=pw.root)
for wt in (pw.path(".claude", "worktrees", "w1"), tempfile.mkdtemp() + "/w2"):
    subprocess.run(GIT + ["worktree", "add", "-q", wt, "-b", os.path.basename(wt)], cwd=pw.root, check=True)
    assert os.path.isdir(os.path.join(wt, ".lucid")) and pw.cli("note", "fact", "from " + wt, cwd=wt).returncode == 0
    assert "from " + wt in pw.cli("log").stdout, wt                # landed in the main dream
    r = subprocess.run(["sh", GUARD, "SessionStart"], capture_output=True, text=True,
                       input=json.dumps({"session_id": "W", "cwd": wt}), env=dict(BASE_ENV, CLAUDE_PROJECT_DIR=wt))
    assert "from " + wt in r.stdout                                # a session inside the worktree sees it too

# concurrency: many writers, one log; ids stay unique and every line parses
pc = Project()
procs = [subprocess.Popen(["sh", "-c", 'for i in 1 2 3 4 5 6 7 8 9 10; do "%s" "%s" --as w%d note fact "n$i"; done'
                           % (sys.executable, LUCID, k)], cwd=pc.root, env=BASE_ENV, stdout=subprocess.DEVNULL)
         for k in range(16)]
for x in procs:
    x.wait()
lines = open(pc.path(".lucid/log.jsonl")).read().splitlines()
assert len(lines) == 160 and sorted(json.loads(l)["id"] for l in lines) == list(range(1, 161))

# parallel tool calls of one agent: atomic state, no spurious full-digest re-injection
pc.hook("SubagentStart", **A)
procs = [subprocess.Popen([sys.executable, LUCID, "hook", "PreToolUse"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                          env=dict(BASE_ENV, LUCID_ROOT=pc.root), text=True) for _ in range(20)]
outs = [x.communicate(json.dumps(dict(session_id="S1", cwd=pc.root, tool_name="Read", tool_input={}, **A)))[0] for x in procs]
assert all(o.strip() == "" for o in outs), [o[:80] for o in outs if o.strip()]
json.loads(open(pc.path(".lucid/.state/%s.json" % a)).read())

# log reset under a running agent: it gets the fresh picture instead of going deaf
open(pc.path(".lucid/log.jsonl"), "w").close()
pc.cli("--as", b, "note", "decision", "after reset")
assert "after reset" in pc.ctx("PreToolUse", **read_tool, **A)

# malformed / hand-edited log lines never crash a hook; good entries still flow
with open(pc.path(".lucid/log.jsonl"), "a") as f:
    f.write('garbage\n[1, 2]\n{"kind": "fact"}\n{"id": "7", "kind": "fact", "agent": "x"}\n'
            '{"id": 99, "kind": "claim", "agent": "q", "globs": "notalist"}\n{"id": 100, "kind": "fact", "agent": "q", '
            '"text": "half-written')
assert pc.hook("PreToolUse", **read_tool, **A)[0] == 0 and pc.cli("status").returncode == 0
with open(pc.path(".lucid/log.jsonl"), "a") as f:
    f.write('"}\n')
pc.cli("--as", b, "note", "fact", "still flowing")
assert "still flowing" in pc.ctx("PreToolUse", **read_tool, **A)

# unicode, huge notes and many claims stay inside the injection budgets
pc.cli("--as", b, "note", "fact", "日本語 ✓ émoji 🌙")
assert "日本語 ✓ émoji 🌙" in pc.ctx("PreToolUse", **read_tool, **A)
pc.cli("--as", b, "note", "fact", "x" * 50000)
assert len(pc.ctx("PreToolUse", **read_tool, **A)) < mod.CAP_DELTA + 400
for k in range(60):
    pc.cli("--as", "w%d" % k, "claim", "mod%d/**" % k, "--for", "a fairly long task description number %d" % k)
assert len(pc.ctx("SessionStart")) < mod.CAP_DIGEST + 400

# bad input / config never breaks a session
assert pc.hook("PreToolUse", env={"LUCID_CLAIM_TTL": "abc"}, **read_tool, **A)[0] == 0
r = subprocess.run([sys.executable, LUCID, "hook", "PreToolUse"], input="not json", capture_output=True, text=True,
                   env=dict(BASE_ENV, LUCID_ROOT=pc.root))
assert r.returncode == 0, r.stderr
assert open(pc.path(".lucid/.gitattributes")).read() == "log.jsonl merge=union\n"
print("edge cases ok")

# ======================= field run fixes (0.4) =======================
peek = lambda proj, ag: proj.ctx("PreToolUse", **read_tool, **ag)
git = lambda proj, *args: subprocess.run(GIT + list(args), cwd=proj.root, capture_output=True, text=True).stdout

# stray writes: a formatter run with an empty file list rewrote 675 files inside a claimed swarm
ps = Project()
git(ps, "init", "-q")
for k in range(25):
    ps.put("app/[id]/f%d.ts" % k, "x\n")                         # Next.js-style brackets: must restore literally
ps.put("mine/a.py", "a\n")
ps.put("keep.py", "k\n")
git(ps, "add", "-A")
git(ps, "commit", "-qm", "init")
ps.put("keep.py", "uncommitted work\n")                          # dirty before the command: never restored


def bash_run(proj, ag, effect, cmd="node_modules/.bin/oxfmt"):
    proj.hook("PreToolUse", tool_name="Bash", tool_input={"command": cmd}, **ag)
    effect()
    return proj.hook("PostToolUse", tool_name="Bash", tool_input={"command": cmd}, **ag)


def reformat(proj, files):
    return lambda: [proj.put(f, open(proj.path(f)).read() + "// formatted\n") for f in files]


lib = ["app/[id]/f%d.ts" % k for k in range(25)]
assert bash_run(ps, B, reformat(ps, lib[:1])) == (0, {})         # no claims anywhere: no swarm, no git call
git(ps, "checkout", "--", lib[0])
ps.hook("SubagentStart", **A)
ps.hook("SubagentStart", **B)
assert ps.cli("--as", a, "claim", "mine/**").returncode == 0
code, _ = bash_run(ps, A, reformat(ps, lib + ["keep.py", "mine/a.py"]))
assert code == 2                                                 # the alarm goes to the agent that ran it...
s = peek(ps, B)
assert "lucid guard" in s and "26 files outside every claim" in s, s   # ...and to everyone else as a blocker
undo = s.split("`git restore --pathspec-from-file=")[1].split("`")[0]
assert "keep.py" not in open(ps.path(undo)).read() and "mine/a.py" not in open(ps.path(undo)).read()
subprocess.run(["git", "restore", "--pathspec-from-file=" + undo], cwd=ps.root, check=True)
assert not [f for f in lib if open(ps.path(f)).read() != "x\n"]  # one command undid all 25
assert open(ps.path("keep.py")).read().startswith("uncommitted work")  # uncommitted edits survive the undo
_, out = bash_run(ps, A, reformat(ps, ["keep.py"]))
assert "outside your claim: keep.py" in out.get("additionalContext", ""), out   # a few files: a quiet word, no blocker
assert bash_run(ps, {}, reformat(ps, ["keep.py"])) == (0, {})   # the lead holds no claims: free to edit
assert "lucid guard" not in peek(ps, B)

# plan ticks via sed (how the field-run lead did it) are credited to the agent and read as progress, not orders
pa = Project()
pa.put(".lucid/plan.md", "# Plan\n\n## Goal\nship\n\n## Tasks\n- [ ] api: src/api/**\n- [ ] ui: src/ui/**\n")
pa.hook("SessionStart")
pa.hook("SubagentStart", **B)
tick = "sed -i '' 's/^- \\[ \\] api:/- [x] api:/' .lucid/plan.md && grep -n x .lucid/plan.md"
pa.hook("PreToolUse", tool_name="Bash", tool_input={"command": tick})
pa.put(".lucid/plan.md", open(pa.path(".lucid/plan.md")).read().replace("- [ ] api:", "- [x] api:"))
s = peek(pa, B)                                                  # a worker's hook races the lead's PostToolUse
assert "progress (%s): [x] api" % main in s and "overrides" not in s and "user" not in s, s
pa.hook("PreToolUse", tool_name="Edit", tool_input={"file_path": pa.path(".lucid/plan.md")}, **A)
pa.put(".lucid/plan.md", open(pa.path(".lucid/plan.md")).read() + "- [ ] cache: src/cache/**\n")
s = peek(pa, B)
assert "PLAN CHANGED by " + a in s and "overrides your original brief" in s, s

# the injected plan keeps Goal and Constraints whole and shortens tasks first
globs = ", ".join("packages/service-%d/src/feature/**" % k for k in range(14))
big = ("# Plan\n\n## Goal\nRole-based access to connectors.\n\n## Shared decisions (lead)\n" + "decided: x\n" * 10 +
       "\n## Tasks (one owner per file set)\n" + "".join("- [ ] w%d: %s\n" % (k, globs) for k in range(5)) +
       "\n## Constraints / non-goals\n- No new deps.\n- Format exact files only.\n- Never call eval() on tool input.\n")
assert len(big) > mod.CAP_PLAN
for text in (big, big.replace("- [ ]", "- [x]")):
    v = mod.plan_view(text)
    assert len(v) <= mod.CAP_PLAN and "Never call eval() on tool input." in v and "Role-based access" in v, v
assert "- [x] w0: done" in mod.plan_view(big.replace("- [ ]", "- [x]"))
pa.hook("PreToolUse", tool_name="Write", tool_input={"file_path": pa.path(".lucid/plan.md")})
pa.put(".lucid/plan.md", big)
r = pa.hook("PostToolUse", tool_name="Write", tool_input={"file_path": pa.path(".lucid/plan.md")})[1]
assert "agents get a trimmed view" in r.get("additionalContext", ""), r

# staleness follows the cited lines, not the whole file
pt = Project()
body = "".join("line %d\n" % k for k in range(1, 101))
pt.put("svc.py", body)
pt.cli("--as", main, "note", "fact", "line 50 matters", "-e", "svc.py:50")
pt.put("svc.py", "# new header\n" * 3 + body.replace("line 90\n", "line 90 edited\n"))
assert "svc.py:50]" in pt.cli("--as", main, "status").stdout and "svc.py:50] ⚠stale" not in pt.cli("status").stdout  # moved, edited 40 lines away: still true
pt.put("svc.py", body.replace("line 50\n", "line 50 changed\n"))
assert "svc.py:50] ⚠stale" in pt.cli("--as", main, "status").stdout

# agents that only read (reviewers) are told not to write; their notes are tagged and fade once stale
R = {"agent_id": "agent-review", "agent_type": "general-purpose"}
r_ = mod.who(R)
assert "don't write to the log" in pt.ctx("SubagentStart", **R) and "don't write" not in pt.ctx("SessionStart")
pt.put("api.py", "def f(): pass\n")
pt.cli("--as", r_, "note", "fact", "Review, not verified: f leaks", "-e", "api.py:1")
assert "%s, reader" % r_ in pt.cli("log").stdout and "f leaks" in pt.cli("status").stdout
out = pt.cli("--as", main, "note", "fact", "#2 was wrong", "-e", "api.py:1").stdout
assert "lucid supersede 2" in out, out
pt.put("api.py", "def f(): return 1\n")
s = pt.cli("status").stdout
assert "f leaks" not in s and "#2 was wrong" in s, s             # the stale outsider note fades; the worker's stays

# lucid wait: wakes the idle lead on another agent's blocker, ignoring everything else
pq = Project()
pq.hook("SubagentStart", **A)
w = subprocess.Popen([sys.executable, LUCID, "--as", main, "wait", "--timeout", "20"], cwd=pq.root, env=BASE_ENV,
                     stdout=subprocess.PIPE, text=True)
time.sleep(0.5)
pq.cli("--as", a, "note", "fact", "just a fact")
pq.cli("--as", main, "note", "blocker", "my own blocker")
pq.cli("--as", a, "note", "blocker", "need the row type")
out = w.communicate(timeout=15)[0]
assert "need the row type" in out and "just a fact" not in out and "my own" not in out, out

# ...and returns as soon as this lead's workers have all stopped (bench: `claude -p` waited 5 idle minutes on it)
pz = Project()
pz.hook("SubagentStart", **A)
w = subprocess.Popen([sys.executable, LUCID, "--as", main, "wait"], cwd=pz.root, env=BASE_ENV, stdout=subprocess.PIPE, text=True)
time.sleep(0.5)
t0 = time.time()
assert pz.hook("SubagentStop", **A)[0] == 0
out = w.communicate(timeout=15)[0]
assert "all your workers have stopped" in out and time.time() - t0 < 5, out

# Stop nudge: a lead going idle while its workers hold claims is told to arm `lucid wait`, once
assert pq.cli("--as", a, "claim", "x.py").returncode == 0
assert pq.hook("Stop")[0] == 0                                   # a waiter is listening (fresh heartbeat)
os.utime(pq.path(".lucid/.state/%s.wait" % main), (0, 0))
assert pq.hook("Stop")[0] == 2 and pq.hook("Stop")[0] == 0       # nudged once per worker set
pq.hook("SubagentStart", **dict(C, session_id="S9"))             # someone else's worker: not this lead's business
pq.cli("--as", c, "claim", "y.py")
assert pq.hook("Stop")[0] == 0

# deltas: long claims summarized, releases dropped
pd = Project()
pd.hook("SubagentStart", **B)
peek(pd, B)
pd.cli("--as", a, "claim", *["src/api/m%d/**" % k for k in range(8)], "--for", "api")
s = peek(pd, B)
assert "8 paths under src/api/ (api)" in s and "m7" not in s, s
pd.cli("--as", a, "release")
assert peek(pd, B) == ""

# all tasks done, nobody working: one hint to end; `end` silences the hooks; `init` archives for the next swarm
pe = Project()
pe.put(".lucid/plan.md", "# Plan\n\n## Goal\nship billing v2\n\n## Tasks\n- [x] api: src/**\n")
pe.hook("SessionStart")
assert "lucid end" in pe.ctx("UserPromptSubmit") and "lucid end" not in pe.ctx("UserPromptSubmit")
pe.cli("--as", a, "note", "decision", "billing uses cents")
assert "ended" in pe.cli("end").stdout
s = pe.ctx("SessionStart")
assert "ship billing v2" in s and "billing uses cents" not in s, s
assert pe.hook("PreToolUse", **read_tool, **B) == (0, {}) and pe.edit(B, "src/x.py") == {}
assert "archived" in pe.cli("init").stdout
assert "billing uses cents" not in pe.cli("status").stdout and not os.path.exists(pe.path(".lucid/ended"))
arch = os.path.join(pe.path(".lucid/archive"), os.listdir(pe.path(".lucid/archive"))[0])
assert "billing uses cents" in open(os.path.join(arch, "log.jsonl")).read()
print("field run fixes ok")

# ======================= performance (10k-entry log) =======================
pp = Project()
for k in range(40):
    pp.put("src/f%d.py" % k, "x = %d\n" % k)
with open(pp.path(".lucid/log.jsonl"), "w") as f:
    for i in range(1, 10001):
        kind = ("decision", "fact", "failed", "claim", "release")[i % 5]
        e = {"id": i, "ts": int(time.time()), "agent": "ag-%d" % (i % 30), "kind": kind, "text": "entry %d with a why" % i}
        if kind in ("claim", "release"):
            e["globs"] = ["src/f%d.py" % (i % 40)]
        else:
            e["evidence"], e["hashes"] = ["src/f%d.py:1" % (i % 40)], {"src/f%d.py" % (i % 40): "0" * 12}
        f.write(json.dumps(e) + "\n")


def timed(fn, n=5):
    ts = []
    for _ in range(n):
        t0 = time.time()
        fn()
        ts.append(time.time() - t0)
    return sorted(ts)[n // 2] * 1000


perf = {
    "SessionStart": timed(lambda: pp.hook("SessionStart")),
    "PreToolUse(Read)": timed(lambda: pp.hook("PreToolUse", **read_tool)),
    "PreToolUse(Edit)": timed(lambda: pp.edit({}, "src/f1.py")),
    "CLI note": timed(lambda: pp.cli("note", "fact", "perf")),
}
print("performance @10k entries (median ms): " + ", ".join("%s %.0f" % kv for kv in perf.items()))
assert len(pp.ctx("SessionStart")) < mod.CAP_DIGEST + 400
assert perf["PreToolUse(Read)"] < 250 and perf["PreToolUse(Edit)"] < 400 and perf["SessionStart"] < 600, perf
print("ok")
