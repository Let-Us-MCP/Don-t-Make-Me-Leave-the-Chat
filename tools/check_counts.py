#!/usr/bin/env python3
"""Numbers the book asserts about its own artefacts must still be true.

A book that says "21 tools" is making a claim that goes stale the moment
somebody adds a tool, and nothing in a normal build notices. The sibling volume
found its own test count wrong in twelve places, having been true about sixty
tests earlier, so this check exists before the same thing happens here.

Each entry names a fact, computes it from the repository, and lists the spellings
the prose is allowed to use for it. Both digits and words count, because the
prose uses both.

    python3 tools/check_counts.py
    python3 tools/check_counts.py --show     # print the current values
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "book"

WORDS = {
    0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six",
    7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve",
    13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen",
    17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
    21: "twenty-one",
}


def node_json(expr: str):
    if shutil.which("node") is None:
        raise SystemExit(
            "node is required to read gallery/registry.js. Install Node 18 or "
            "later, or run this check locally."
        )
    out = subprocess.run(
        [
            "node", "--input-type=module", "-e",
            f"import('{ROOT}/gallery/registry.js').then(m=>{{const APPS=m.APPS;"
            f"process.stdout.write(JSON.stringify({expr}))}})",
        ],
        capture_output=True, text=True, cwd=ROOT, timeout=60,
    )
    if out.returncode != 0:
        raise SystemExit(f"could not read the registry:\n{out.stderr}")
    return json.loads(out.stdout)


def facts() -> dict[str, int]:
    tools = node_json("APPS.length")
    apps = node_json("APPS.filter(a=>a.ui).length")
    hosts = json.loads((ROOT / "gallery" / "probe" / "hosts.json").read_text())
    scenes = (ROOT / "gallery" / "host" / "scenes.js").read_text()
    figures = len(re.findall(r'figure:\s*"', scenes))
    renders = len(list((ROOT / "docs" / "figures").glob("fig-*.png")))
    return {
        "tools in the gallery": tools,
        "apps with a UI": apps,
        "clients that render apps": sum(1 for h in hosts["hosts"] if h["apps"]),
        "hosts listed in the matrix": len(hosts["hosts"]),
        "scenes with a figure number": figures,
        "annotated renders on disk": renders,
        "chapters": len(list((BOOK / "chapters").glob("ch*.md"))),
        "appendices": len(list((BOOK / "appendices").glob("app*.md"))),
    }


# fact -> regexes in the prose that must resolve to it.
# Each pattern has one capturing group holding the number, in digits or words.
ASSERTIONS = [
    ("tools in the gallery", r"(\w+|\d+) tools checked"),
    ("apps with a UI", r"(\w+|\d+) apps(?:,| ) (?:in the gallery|and one server)"),
    ("apps with a UI", r"one MCP server with (\w+|\d+) apps"),
    ("apps with a UI", r"gallery has (\w+|\d+) apps"),
    ("clients that render apps", r"(\w+|\d+) clients render apps"),
    ("chapters", r"(\w+|\d+) short chapters"),
    ("annotated renders on disk", r"\*\*(\w+|\d+) annotated renders\*\*"),
    ("appendices", r"(\w+|\d+) appendices"),
]


def as_int(token: str) -> int | None:
    token = token.lower()
    if token.isdigit():
        return int(token)
    for n, w in WORDS.items():
        if w == token:
            return n
    return None


FENCE = re.compile(r"```.*?```", re.S)


def prose_only(text: str) -> str:
    """Blank out fenced blocks, preserving line numbers.

    Captured output is a record of a moment and is allowed to disagree with the
    present: the eval run quoted in Chapter 11 reported twenty errors, and those
    errors are fixed, which is the point of quoting it. Live claims live in the
    prose, and that is what this checks.
    """
    return FENCE.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--show", action="store_true")
    args = ap.parse_args()

    f = facts()
    if args.show:
        for k, v in f.items():
            print(f"  {v:>3}  {k}")
        return 0

    text_by_file = {
        p.name: prose_only(p.read_text(encoding="utf-8"))
        for sub in ("chapters", "appendices", "frontmatter")
        for p in (BOOK / sub).glob("*.md")
    }
    text_by_file["README.md"] = prose_only((ROOT / "README.md").read_text())

    bad = checked = 0
    for fact, pattern in ASSERTIONS:
        want = f[fact]
        rx = re.compile(pattern, re.I)
        for name, text in text_by_file.items():
            for m in rx.finditer(text):
                checked += 1
                got = as_int(m.group(1))
                if got is None or got != want:
                    line = text.count("\n", 0, m.start()) + 1
                    print(f"FAIL  {name}:{line} says \"{m.group(0)}\" "
                          f"but {fact} is {want}")
                    bad += 1

    print(f"\n{checked} assertion(s) checked against {len(f)} facts, {bad} wrong")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
