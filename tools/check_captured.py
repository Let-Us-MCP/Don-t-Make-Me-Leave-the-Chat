#!/usr/bin/env python3
"""Captured output that is used as evidence must still be true.

`tools/check_listings.py` classifies a fenced block as `captured from `cmd``.
Most of those are history and are allowed to disagree with the present: the eval
run in Chapter 11 reported twenty errors, and those errors are fixed, which is
the point of quoting it.

But some captured output is used as *live evidence for an argument*, and that
kind rots invisibly. Chapter 12 quoted "8/16 apps return a usable text answer"
as proof that the before-exhibits fail the text rung; adding one app made it
8/17 and the sentence beside it wrong, and nothing noticed, because the number
lived inside a fence where the counts checker does not look.

So: for a small allowlist of cheap, safe, offline commands, re-run them and
check that the quoted lines still appear in the output. Anything not on the
allowlist is skipped and reported, because running arbitrary strings out of a
book is not a thing this should do.

    python3 tools/check_captured.py
"""

from __future__ import annotations

import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "book"

# Only these are re-run. Each is offline, fast, and read-only.
ALLOWED = {
    "node gallery/evals/run.js --all": None,
    "node gallery/probe/probe.js": "serve",   # needs the gallery running
    "tools/list": "serve",
    "tools/call service_status": "serve",
}

FENCE = re.compile(
    r"<!--\s*listing:\s*captured(?:\s+from\s+`(?P<cmd>[^`]+)`)?[^>]*-->\s*"
    r"```[a-z]*\n(?P<body>.*?)```",
    re.S,
)


def flat(text: str) -> str:
    """Whitespace- and quote-insensitive.

    A JSON blob pretty-printed for the page is still the same blob. A number
    that changed is not.
    """
    return re.sub(r"\s+", "", text.replace("'", '"'))


def serve():
    p = subprocess.Popen(["node", str(ROOT / "gallery" / "serve.js")],
                         cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    return p


def run(cmd: str) -> str:
    if cmd == "tools/list":
        return post('{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
    if cmd.startswith("tools/call "):
        name = cmd.split(" ", 1)[1]
        return post('{"jsonrpc":"2.0","id":1,"method":"tools/call",'
                    f'"params":{{"name":"{name}","arguments":{{}}}}}}')
    out = subprocess.run(cmd.split(), cwd=ROOT, capture_output=True, text=True)
    return out.stdout + out.stderr


def post(body: str) -> str:
    out = subprocess.run(
        ["curl", "-s", "-X", "POST", "http://localhost:8931/mcp",
         "-H", "content-type: application/json", "-d", body],
        capture_output=True, text=True)
    return out.stdout


def significant(body: str) -> list[str]:
    """Lines worth re-checking: substantive, not prompts, not ellipses."""
    out = []
    for line in body.splitlines():
        s = line.strip()
        if len(s) < 20 or s.startswith(("$", "#", "//")) or "..." in s:
            continue
        out.append(s)
    return out


def main() -> int:
    files = sorted(
        list((BOOK / "chapters").glob("*.md")) + list((BOOK / "appendices").glob("*.md"))
    )
    jobs: dict[str, list[tuple[str, int, list[str]]]] = {}
    skipped = []

    for path in files:
        text = path.read_text(encoding="utf-8")
        for m in FENCE.finditer(text):
            cmd = (m.group("cmd") or "").strip()
            line = text.count("\n", 0, m.start()) + 1
            if cmd not in ALLOWED:
                skipped.append(f"{path.name}:{line} not on the allowlist: {cmd or '(no command named)'}")
                continue
            jobs.setdefault(cmd, []).append((path.name, line, significant(m.group("body"))))

    server = None
    if any(ALLOWED[c] == "serve" for c in jobs):
        server = serve()

    bad = checked = 0
    try:
        for cmd, uses in jobs.items():
            output = run(cmd)
            for name, line, lines in uses:
                flat_output = flat(output)
                for want in lines:
                    checked += 1
                    if flat(want) not in flat_output:
                        bad += 1
                        print(f"DRIFT {name}:{line}  `{cmd}` no longer prints:\n"
                              f"      {want[:88]}")
    finally:
        if server:
            server.terminate()

    for s in skipped:
        print(f"skip  {s}")
    print(f"\n{checked} captured line(s) re-checked, {bad} drifted, "
          f"{len(skipped)} not re-runnable")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
