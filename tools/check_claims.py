#!/usr/bin/env python3
"""Verify the book's protocol claims against the MCP specification.

The spec repository is a read-only input at `proto/modelcontextprotocol`, and it
is never committed, so this check skips cleanly when it is absent (which is what
happens in CI). Run it locally before publishing anything that names a field.

Each claim below is a thing the book asserts and a place the specification says
it. A claim whose evidence disappears is either a spec change we have not
noticed or a sentence we made up, and both are worth failing a build over.

    python3 tools/check_claims.py
    python3 tools/check_claims.py --list     # what is being checked, and where
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / "proto" / "modelcontextprotocol"
BOOK = ROOT / "book"
GALLERY = ROOT / "gallery"

# (claim, evidence regex, files to search under SPEC)
CLAIMS = [
    ("ui:// is the scheme for UI resources",
     r"ui://", ["docs/extensions/apps"]),
    ("the MIME type is text/html;profile=mcp-app",
     r"text/html;profile=mcp-app", ["docs/extensions", "docs/specification/2026-07-28"]),
    ("a tool points at its UI with _meta.ui.resourceUri",
     r"_meta\.ui\.resourceUri", ["docs/extensions/apps"]),
    ("the extension identifier is io.modelcontextprotocol/ui",
     r"io\.modelcontextprotocol/ui", ["docs/extensions"]),
    ("clients declare extensions in _meta clientCapabilities",
     r"io\.modelcontextprotocol/clientCapabilities", ["docs/extensions/overview.mdx"]),
    ("csp and permissions live on the UI resource, not the tool",
     r"live on the UI \*\*resource\*\* rather than the tool", ["docs/docs/2026-07-28"]),
    ("csp declares connectDomains",
     r"connectDomains", ["docs/docs/2026-07-28"]),
    ("a UI resource can request a border with prefersBorder",
     r"prefersBorder", ["docs/docs/2026-07-28"]),
    ("apps run in a sandboxed iframe",
     r"sandboxed\s+\[?iframe", ["docs/extensions/apps"]),
    ("ui/initialize is an app-to-host method",
     r"ui/initialize", ["docs/extensions/apps"]),
    ("every result carries resultType in 2026-07-28",
     r'"resultType"', ["docs/specification/2026-07-28"]),
    ("list results require ttlMs and cacheScope",
     r"Require `ttlMs` and `cacheScope`", ["docs/specification/2026-07-28/changelog.mdx"]),
    ("MRTR carries elicitation via input_required and inputRequests",
     r"`resultType: \"input_required\"`\)? whose `inputRequests`", 
     ["docs/specification/2026-07-28/changelog.mdx"]),
    ("servers MUST NOT use form elicitation for credentials",
     r"MUST NOT\*\* use form mode elicitation to request sensitive information",
     ["docs/specification/2026-07-28/client/elicitation.mdx"]),
    ("clients MUST show which server is asking",
     r"makes it clear which server is requesting information",
     ["docs/specification/2026-07-28/client/elicitation.mdx"]),
]

# Field names the book or the gallery must NOT invent. If one of these appears
# in our source and nowhere in the spec, we made it up.
INVENTED_WATCH = [
    "preferredFrameSize", "preferredSize", "frameSize", "uiVersion",
]


def spec_text(globs: list[str]) -> str:
    out = []
    for g in globs:
        base = SPEC / g
        if base.is_file():
            out.append(base.read_text(encoding="utf-8", errors="ignore"))
        elif base.is_dir():
            for f in base.rglob("*"):
                if f.is_file() and f.suffix in (".mdx", ".md", ".json"):
                    out.append(f.read_text(encoding="utf-8", errors="ignore"))
    return "\n".join(out)


def our_text() -> str:
    out = []
    for base in (BOOK, GALLERY):
        for f in base.rglob("*"):
            if f.is_file() and f.suffix in (".md", ".js", ".html", ".mjs", ".json"):
                out.append(f.read_text(encoding="utf-8", errors="ignore"))
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()

    if args.list:
        for claim, pat, where in CLAIMS:
            print(f"  {claim}\n      /{pat}/ in {', '.join(where)}")
        return 0

    if not SPEC.exists():
        print(f"spec not present at {SPEC.relative_to(ROOT)}; skipping "
              f"{len(CLAIMS)} claim checks")
        return 0

    failed = 0
    for claim, pat, where in CLAIMS:
        body = spec_text(where)
        if not body:
            print(f"MISSING SOURCE  {claim}\n                nothing readable under {where}")
            failed += 1
            continue
        if re.search(pat, body):
            print(f"ok    {claim}")
        else:
            print(f"FAIL  {claim}\n      no match for /{pat}/ under {where}")
            failed += 1

    ours = our_text()
    everything = spec_text(["docs"])
    for name in INVENTED_WATCH:
        if name in ours and name not in everything:
            print(f"FAIL  we use `{name}` and the specification never mentions it")
            failed += 1

    print(f"\n{len(CLAIMS)} claims checked, {failed} problem(s)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
