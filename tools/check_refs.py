#!/usr/bin/env python3
"""Cross-reference and link integrity.

Checks that every "Chapter N" and "Figure N-M" reference in the prose points at
something that exists, that every figure the book shows is on disk, and that
every figure on disk is used somewhere.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "book"
FIGS = ROOT / "docs" / "figures"

files = sorted(
    list((BOOK / "frontmatter").glob("*.md"))
    + list((BOOK / "chapters").glob("*.md"))
    + list((BOOK / "appendices").glob("*.md"))
)

chapters = set()
appendices = set()
for p in files:
    head = p.read_text(encoding="utf-8")[:400]
    m = re.search(r"^number: (\w+)", head, re.M)
    if not m:
        continue
    (appendices if p.parent.name == "appendices" else chapters).add(m.group(1))

problems = []
used = set()

for p in files:
    text = p.read_text(encoding="utf-8")
    for m in re.finditer(r"\bChapters? (\d+)(?: and (\d+))?", text):
        for g in m.groups():
            if g and g not in chapters:
                problems.append(f"{p.name}: reference to Chapter {g}, which does not exist")
    for m in re.finditer(r"\bAppendix ([A-F])\b", text):
        if m.group(1) not in appendices:
            problems.append(f"{p.name}: reference to Appendix {m.group(1)}, which does not exist")
    for m in re.finditer(r"!\[[^\]]*\]\((figures/[^)]+)\)", text):
        rel = m.group(1)
        used.add(rel)
        if not (ROOT / "docs" / rel).exists():
            problems.append(f"{p.name}: figure {rel} is referenced and does not exist")
    for m in re.finditer(r"\bFigure (\d+)-(\d+)", text):
        want = f"figures/fig-{m.group(1)}-{m.group(2)}.png"
        used.add(want)
        if not (ROOT / "docs" / want).exists():
            problems.append(f"{p.name}: Figure {m.group(1)}-{m.group(2)} has no file")

orphans = sorted(
    f"figures/{f.name}" for f in FIGS.glob("*.png")
    if f"figures/{f.name}" not in used and f.name != "cover.png"
)
for o in orphans:
    problems.append(f"{o} is built and never used in the book")

for line in problems:
    print(line)
print(f"\n{len(files)} files, {len(chapters)} chapters, {len(appendices)} appendices, "
      f"{len(used)} figure references, {len(problems)} problem(s)")
sys.exit(1 if problems else 0)
