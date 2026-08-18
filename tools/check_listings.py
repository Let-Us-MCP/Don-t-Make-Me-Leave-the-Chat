#!/usr/bin/env python3
"""Every listing is either extracted, captured, or labelled.

The book tells readers that its code comes from the gallery. A first run of this
check found 26 of 31 listings with no literal match in `gallery/`, and while most
of those were legitimately not gallery source (wire messages, terminal output, a
deliberately fictional listing), at least two were paraphrases presented as
extracted. That is the kind of small dishonesty that makes a reader stop trusting
the rest.

So every fenced block must be one of three things, and must say which:

  extracted   it appears verbatim in gallery/ or tools/. Nothing to declare.
  captured    it is real output from a real command, and still true. Declare
              with ``<!-- listing: captured from `<command>` -->``, and
              `tools/check_captured.py` re-runs the command and diffs it.
  historical  it was real output once, from a state the repository has moved
              past, and it is quoted because the past state is the point.
              Declare with ``<!-- listing: historical from `<command>` -->``
  illustrative  it is a shape rather than a file: wire JSON, a sketch, an
              example listing. Declare with ``<!-- listing: illustrative -->``

Declarations are HTML comments, so they vanish from the rendered page and stay
visible in the source, which is where the honesty has to live.

    python3 tools/check_listings.py
    python3 tools/check_listings.py --report   # classify without failing
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "book"

FENCE = re.compile(
    r"(?:<!--\s*listing:\s*(?P<decl>[a-z]+)[^>]*-->\s*\n)?"
    r"```(?P<lang>[a-z]*)\n(?P<body>.*?)```",
    re.S,
)

# Corpora a listing can be extracted from.
SOURCE_DIRS = ["gallery", "tools", ".github"]
SOURCE_SUFFIXES = {".js", ".mjs", ".html", ".css", ".json", ".py", ".yml", ".yaml"}


def corpus() -> str:
    parts = []
    for d in SOURCE_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for f in base.rglob("*"):
            if f.is_file() and f.suffix in SOURCE_SUFFIXES:
                parts.append(f.read_text(encoding="utf-8", errors="ignore"))
    return "\n".join(parts)


def normalise(text: str) -> str:
    """Whitespace-insensitive, quote-insensitive comparison.

    A listing reindented to fit the page is still extracted. A listing whose
    logic was rewritten is not, and that difference survives this.
    """
    text = text.replace('"', "'")
    return re.sub(r"\s+", " ", text).strip()


def probes(body: str) -> list[str]:
    """The lines worth matching: long, substantive, not comments or prompts."""
    out = []
    for line in body.splitlines():
        s = line.strip()
        if len(s) < 24:
            continue
        if s.startswith(("//", "/*", "*", "#", "$", ">", "<!--")):
            continue
        out.append(s)
    out.sort(key=len, reverse=True)
    return out[:3]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--report", action="store_true", help="classify, do not fail")
    args = ap.parse_args()

    src = normalise(corpus())
    counts = {"extracted": 0, "captured": 0, "historical": 0, "illustrative": 0}
    problems = []

    files = sorted(
        list((BOOK / "chapters").glob("*.md"))
        + list((BOOK / "appendices").glob("*.md"))
        + list((BOOK / "frontmatter").glob("*.md"))
    )

    for path in files:
        text = path.read_text(encoding="utf-8")
        for m in FENCE.finditer(text):
            body, decl = m.group("body"), m.group("decl")
            line = text.count("\n", 0, m.start()) + 1
            found = probes(body)
            matched = bool(found) and all(normalise(p) in src for p in found)

            if matched:
                counts["extracted"] += 1
                if decl == "illustrative":
                    problems.append(
                        f"{path.name}:{line} labelled illustrative but it is in the source; "
                        f"drop the label and let it be extracted")
                continue

            if decl in ("captured", "historical", "illustrative"):
                counts[decl] += 1
                continue

            if found:
                preview = found[0]
            else:
                first = body.strip().splitlines()
                preview = first[0] if first else "(empty)"
            problems.append(
                f"{path.name}:{line} undeclared and not in the source. Either put the "
                f"code in the gallery, or label it:\n"
                f"        <!-- listing: illustrative -->  /  "
                f"<!-- listing: captured from `cmd` -->\n"
                f"        {preview[:78]}")

    total = sum(counts.values()) + len(problems)
    print(f"{total} listings: {counts['extracted']} extracted, "
          f"{counts['captured']} captured, {counts['historical']} historical, "
          f"{counts['illustrative']} illustrative, {len(problems)} undeclared")
    for p in problems:
        print(f"  {p}")

    if args.report:
        return 0
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
