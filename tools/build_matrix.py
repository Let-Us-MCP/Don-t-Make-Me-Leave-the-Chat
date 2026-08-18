#!/usr/bin/env python3
"""Generate Appendix B from gallery/probe/hosts.json.

Hand-maintained compatibility tables rot, and the rot is invisible. This one is
generated, carries its source, and states the date it was checked, so a reader
can see how stale it is instead of guessing.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "gallery" / "probe" / "hosts.json"
OUT = ROOT / "book" / "appendices" / "appB.md"

data = json.loads(SRC.read_text())
hosts = data["hosts"]
yes = sum(1 for h in hosts if h["apps"])

rows = []
for h in hosts:
    mark = "yes" if h["apps"] else "no"
    name = f"[{h['name']}]({h['url']})"
    rows.append(f"| {name} | {mark} | {h.get('note', '')} |")

notes = [h for h in hosts if h.get("note")]

body = f"""---
number: B
part: Appendices
title: "The Host Capability Matrix, Generated"
slug: appendix-b
summary: "Which hosts render MCP Apps, where the data came from, and how to regenerate it."
---

**Extension:** `{data['extension']}`
**Checked:** {data['checked']}
**Source:** <{data['source']}>

{data['note']}

| Host | Renders MCP Apps | Notes |
|---|---|---|
{chr(10).join(rows)}

{yes} of {len(hosts)} listed clients render MCP Apps.

## How to regenerate

```bash
python3 tools/build_matrix.py
```

The data lives in `gallery/probe/hosts.json`. Editing that file and re-running
is the whole workflow; nothing in this appendix is typed by hand.

## The half you can automate

Host support is somebody else's published fact. Server support is yours, and it
is probeable:

```bash
node gallery/probe/probe.js http://localhost:8931/mcp
```

The probe reports whether the server declares the extension, which tools carry a
`ui://` resource, what each app is allowed to reach over the network, and, most
usefully, how many of your apps return a text answer good enough for a host that
does not render apps at all. On the gallery it says 8 of 17, and the 9 that fail
are exactly the book's deliberately over-built "before" exhibits.

That last number is the one to watch. It is the fallback ladder from Chapter 12,
measured.
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(body)
print(f"wrote {OUT.relative_to(ROOT)}: {len(hosts)} hosts, {yes} with app support")
