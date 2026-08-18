#!/usr/bin/env python3
"""Measure the framing text's prose density, so our targets are not invented.

Needs a copy of Don't Make Me Think, Revisited as a PDF. That file is not in
this repository and never will be; supply your own copy on the command line.

    .venv/bin/python tools/measure_reference.py path/to/book.pdf

The numbers this printed when the targets in tools/audit_density.py were set:

    paragraph blocks   803
    mean words/para    46.4
    median             42
    p25 / p75          33 / 57
    words per page     255

The last one is low because half of every page is a screenshot. The relevant
figure is the paragraph length, and 46 is the number to beat a draft against.
"""

from __future__ import annotations

import re
import statistics
import sys

try:
    import pypdf
except ImportError:
    raise SystemExit("pip install pypdf")

path = sys.argv[1] if len(sys.argv) > 1 else None
if not path:
    raise SystemExit(__doc__)

first, last = 24, 170
reader = pypdf.PdfReader(path)
text = "\n".join((p.extract_text() or "") for p in reader.pages[first:last])
text = text.replace("\t", " ")

paragraphs, current = [], []
for line in (l.strip() for l in text.split("\n")):
    if not line:
        if current:
            paragraphs.append(" ".join(current))
            current = []
        continue
    current.append(line)
    joined = " ".join(current)
    if line.endswith((".", "!", "?", ".”", "?”")) and len(joined.split()) > 25:
        paragraphs.append(joined)
        current = []
if current:
    paragraphs.append(" ".join(current))

lengths = [len(re.findall(r"[A-Za-z][A-Za-z'-]+", p)) for p in paragraphs]
lengths = [n for n in lengths if n >= 12]      # drop captions and labels
q = statistics.quantiles(lengths, n=4)

print(f"pages sampled     {first}-{last}")
print(f"paragraph blocks  {len(lengths)}")
print(f"mean words/para   {statistics.mean(lengths):.1f}")
print(f"median            {statistics.median(lengths):.0f}")
print(f"p25 / p75         {q[0]:.0f} / {q[2]:.0f}")
print(f"words per page    {sum(lengths) / (last - first):.0f}")
