#!/usr/bin/env python3
"""Build the website from the book's Markdown.

There is exactly one copy of every sentence in this book: the Markdown under
`book/`. This script turns it into `docs/`, which is what GitHub Pages serves.

Pandoc does the Markdown. Everything else here is the wrapper: the sidebar, the
pager, the law blocks, and the figure captions.

    python3 tools/build_site.py
"""

from __future__ import annotations

import html
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "book"
OUT = ROOT / "docs"

TITLE = "Don't Make Me Leave the Chat"
SUBTITLE = "A common sense approach to MCP Apps"
REPO = "https://github.com/Let-Us-MCP/Don-t-Make-Me-Leave-the-Chat"


@dataclass
class Page:
    path: Path
    slug: str
    title: str
    part: str
    summary: str = ""
    number: str = ""
    body: str = ""
    meta: dict = field(default_factory=dict)

    @property
    def href(self) -> str:
        return f"{self.slug}.html"

    @property
    def label(self) -> str:
        if self.part == "Appendices":
            return f"Appendix {self.number}. {self.title}"
        if self.number:
            return f"{self.number}. {self.title}"
        return self.title


def parse(path: Path) -> Page:
    raw = path.read_text(encoding="utf-8")
    meta: dict = {}
    if raw.startswith("---\n"):
        end = raw.index("\n---\n", 3)
        for line in raw[4:end].splitlines():
            if ":" not in line:
                continue
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"')
        raw = raw[end + 5 :]
    return Page(
        path=path,
        slug=meta.get("slug", path.stem),
        title=meta.get("title", path.stem),
        part=meta.get("part", ""),
        summary=meta.get("summary", ""),
        number=str(meta.get("number", "")),
        body=raw,
        meta=meta,
    )


def collect() -> list[Page]:
    order: list[Page] = []
    for name in ("preface", "how-to-read"):
        order.append(parse(BOOK / "frontmatter" / f"{name}.md"))
    order += [parse(p) for p in sorted((BOOK / "chapters").glob("ch*.md"))]
    order += [parse(p) for p in sorted((BOOK / "appendices").glob("app*.md"))]
    order.append(parse(BOOK / "frontmatter" / "about.md"))
    return order


def pandoc(markdown: str) -> str:
    proc = subprocess.run(
        ["pandoc", "--from=markdown+fenced_divs+pipe_tables+backtick_code_blocks"
                   "+auto_identifiers+smart",
         "--to=html5", "--no-highlight", "--wrap=none"],
        input=markdown, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(f"pandoc failed:\n{proc.stderr}")
    return proc.stdout


LAW_RE = re.compile(
    r'<div class="law" data-n="(\d+)">\s*<p>(.*?)</p>\s*</div>', re.S
)
FIG_RE = re.compile(
    r'<p><img src="(figures/[^"]+)" alt="([^"]*)"\s*/?></p>'
)


def transform(body: str) -> str:
    def law(m: re.Match) -> str:
        return (
            f'<aside class="law"><span class="lawnum">Law {m.group(1)}</span>'
            f'<p>{m.group(2)}</p></aside>'
        )

    def figure(m: re.Match) -> str:
        src, alt = m.group(1), m.group(2)
        caption = alt
        return (
            f'<figure><img src="{src}" alt="{html.escape(alt, quote=True)}" loading="lazy">'
            f'<figcaption>{caption}</figcaption></figure>'
        )

    # Pandoc emits row classes and colgroups that differ between versions, and
    # the CI check compares committed HTML byte for byte. Neither is used by the
    # stylesheet, so both are removed and the output stops depending on which
    # pandoc built it.
    body = re.sub(r'<colgroup>.*?</colgroup>\s*', "", body, flags=re.S)
    body = re.sub(r'<tr class="(?:header|odd|even)">', "<tr>", body)

    body = LAW_RE.sub(law, body)
    body = FIG_RE.sub(figure, body)
    body = body.replace("<table>", '<div class="table-wrap"><table>')
    body = body.replace("</table>", "</table></div>")
    body = re.sub(r'<blockquote>\s*<p>', '<blockquote><p>', body)
    return body


CSS = """
:root{
  --ink:#15181D; --muted:#5B6472; --rule:#D8DDE4; --wash:#F5F6F8;
  --paper:#FFFFFF; --accent:#0F5C8C; --accent-soft:#E7F0F6;
  --warm:#B4531A; --warm-soft:#FBF0E7; --good:#2C6E49; --good-soft:#E9F2EC;
  --danger:#9B2226; --danger-soft:#FAECEC;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){
  :root{
    --ink:#E7EAEE; --muted:#98A2B0; --rule:#2C333D; --wash:#171B21;
    --paper:#0F1216; --accent:#63AEDC; --accent-soft:#14232E;
    --warm:#E08B4F; --warm-soft:#2A1D13; --good:#6FBF8E; --good-soft:#13221A;
    --danger:#E4796F; --danger-soft:#291516;
  }
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--serif);font-size:18px;line-height:1.62;
  -webkit-text-size-adjust:100%}
.layout{display:grid;grid-template-columns:290px minmax(0,1fr);
  max-width:1280px;margin:0 auto}
nav.toc{position:sticky;top:0;height:100vh;overflow-y:auto;padding:26px 20px 60px;
  border-right:1px solid var(--rule);font-family:var(--sans);font-size:14px}
nav.toc .brand{display:block;font-weight:700;font-size:16px;color:var(--ink);
  text-decoration:none;line-height:1.3;margin-bottom:4px}
nav.toc .tagline{color:var(--muted);font-size:12.5px;margin:0 0 18px;line-height:1.45}
nav.toc .part{margin:18px 0 6px;font-size:11px;letter-spacing:.09em;
  text-transform:uppercase;color:var(--muted);font-weight:700}
nav.toc a{display:block;padding:4px 8px;margin-left:-8px;border-radius:5px;
  color:var(--muted);text-decoration:none}
nav.toc a:hover{background:var(--wash);color:var(--ink)}
nav.toc a.current{background:var(--accent-soft);color:var(--accent);font-weight:600}
main{padding:44px 52px 120px;min-width:0;max-width:78ch}
h1,h2,h3,h4{font-family:var(--sans);line-height:1.25;color:var(--ink)}
h1{font-size:2.05em;margin:0 0 .2em;letter-spacing:-.015em}
h2{font-size:1.42em;margin:2em 0 .5em;padding-top:.35em}
h3{font-size:1.14em;margin:1.7em 0 .4em}
p{margin:0 0 1.05em}
a{color:var(--accent)}
.eyebrow{font-family:var(--sans);font-size:12px;letter-spacing:.09em;
  text-transform:uppercase;color:var(--muted);margin:0 0 .5em;font-weight:700}
.summary{font-family:var(--sans);font-size:15px;color:var(--muted);
  margin:0 0 2.2em;line-height:1.5}
code{font-family:var(--mono);font-size:.855em;background:var(--wash);
  padding:.12em .36em;border-radius:4px;word-break:break-word}
pre{background:var(--wash);border-left:3px solid var(--rule);
  border-radius:0 6px 6px 0;padding:14px 16px;overflow-x:auto;
  font-size:13.5px;line-height:1.5;margin:1.3em 0}
pre code{background:none;padding:0;font-size:inherit;word-break:normal}
aside.law{border-left:4px solid var(--accent);background:var(--accent-soft);
  padding:16px 20px;margin:1.8em 0;border-radius:0 8px 8px 0}
aside.law .lawnum{display:block;font-family:var(--sans);font-weight:700;
  font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--accent);margin-bottom:.4em}
aside.law p{margin:0;font-family:var(--sans);font-size:1.16em;font-weight:700;
  line-height:1.35}
blockquote{border-left:3px solid var(--warm);background:var(--warm-soft);
  margin:1.5em 0;padding:12px 18px;border-radius:0 6px 6px 0;font-size:.98em}
blockquote p:last-child{margin-bottom:0}
figure{margin:2.2em 0;text-align:center}
figure img{max-width:100%;height:auto;border-radius:8px;border:1px solid var(--rule)}
@media (prefers-color-scheme: dark){
  figure img{background:#fff;padding:8px}
}
figcaption{font-family:var(--sans);font-size:13.5px;color:var(--muted);
  margin-top:.7em;text-align:left;line-height:1.5}
.table-wrap{overflow-x:auto;margin:1.5em 0}
table{border-collapse:collapse;width:100%;font-family:var(--sans);font-size:14.5px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--rule);
  vertical-align:top}
thead th{border-bottom:2px solid var(--rule);font-weight:700}
ul,ol{padding-left:1.35em;margin:0 0 1.05em}
li{margin-bottom:.32em}
hr{border:0;border-top:1px solid var(--rule);margin:2.5em 0}
.pager{display:flex;justify-content:space-between;gap:16px;margin-top:4em;
  padding-top:1.4em;border-top:1px solid var(--rule);font-family:var(--sans);
  font-size:14px}
.pager a{text-decoration:none;max-width:46%}
.pager .dir{display:block;font-size:11px;text-transform:uppercase;
  letter-spacing:.08em;color:var(--muted)}
.hero{display:grid;grid-template-columns:220px minmax(0,1fr);gap:36px;
  align-items:start;margin-bottom:2.4em}
.hero img{width:100%;border-radius:10px;border:1px solid var(--rule)}
.hero h1{margin-bottom:.15em}
.hero .sub{font-family:var(--sans);color:var(--muted);font-size:16px;
  margin:0 0 1em}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
  gap:12px;margin:1.6em 0}
.cards a{display:block;border:1px solid var(--rule);border-radius:9px;
  padding:12px 14px;text-decoration:none;color:var(--ink);font-family:var(--sans)}
.cards a:hover{border-color:var(--accent);background:var(--accent-soft)}
.cards .n{font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted);font-weight:700}
.cards .t{font-weight:600;font-size:15px;margin:.15em 0 .25em}
.cards .s{font-size:12.5px;color:var(--muted);line-height:1.45}
.menu{display:none}
@media (max-width:900px){
  .layout{grid-template-columns:minmax(0,1fr)}
  nav.toc{position:static;height:auto;border-right:0;border-bottom:1px solid var(--rule)}
  main{padding:28px 20px 80px}
  .hero{grid-template-columns:minmax(0,1fr)}
  .hero img{max-width:220px}
}
"""


def sidebar(pages: list[Page], current: str) -> str:
    out = [
        f'<nav class="toc"><a class="brand" href="index.html">{html.escape(TITLE)}</a>',
        f'<p class="tagline">{html.escape(SUBTITLE)}</p>',
    ]
    part = None
    for p in pages:
        if p.part != part:
            part = p.part
            out.append(f'<div class="part">{html.escape(part)}</div>')
        cls = ' class="current"' if p.slug == current else ""
        out.append(f'<a href="{p.href}"{cls}>{html.escape(p.label)}</a>')
    out.append(f'<div class="part">Elsewhere</div><a href="{REPO}">Repository</a>')
    out.append("</nav>")
    return "\n".join(out)


def page_html(pages: list[Page], p: Page, body: str, extra_title: str = "") -> str:
    i = next((k for k, q in enumerate(pages) if q.slug == p.slug), -1)
    prev_p = pages[i - 1] if i > 0 else None
    next_p = pages[i + 1] if 0 <= i < len(pages) - 1 else None
    pager = ""
    if prev_p or next_p:
        left = (
            f'<a href="{prev_p.href}"><span class="dir">Previous</span>{html.escape(prev_p.label)}</a>'
            if prev_p else "<span></span>"
        )
        right = (
            f'<a href="{next_p.href}" style="text-align:right">'
            f'<span class="dir">Next</span>{html.escape(next_p.label)}</a>'
            if next_p else "<span></span>"
        )
        pager = f'<div class="pager">{left}{right}</div>'

    head_title = extra_title or p.label
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(head_title)} &middot; {html.escape(TITLE)}</title>
<meta name="description" content="{html.escape(p.summary or SUBTITLE)}">
<meta property="og:title" content="{html.escape(head_title)}">
<meta property="og:description" content="{html.escape(p.summary or SUBTITLE)}">
<style>{CSS}</style>
</head>
<body>
<div class="layout">
{sidebar(pages, p.slug)}
<main>
{body}
{pager}
</main>
</div>
</body>
</html>
"""


def build_index(pages: list[Page]) -> str:
    parts: dict[str, list[Page]] = {}
    for p in pages:
        parts.setdefault(p.part, []).append(p)

    sections = []
    for part, group in parts.items():
        cards = []
        for p in group:
            n = (
                f"Appendix {p.number}" if p.part == "Appendices"
                else (f"Chapter {p.number}" if p.number else "&nbsp;")
            )
            cards.append(
                f'<a href="{p.href}"><span class="n">{n}</span>'
                f'<div class="t">{html.escape(p.title)}</div>'
                f'<div class="s">{html.escape(p.summary)}</div></a>'
            )
        sections.append(
            f"<h2>{html.escape(part)}</h2>\n<div class=\"cards\">"
            + "\n".join(cards) + "</div>"
        )

    hero = f"""<div class="hero">
<img src="figures/cover.png" alt="Cover of {html.escape(TITLE)}">
<div>
<h1>{html.escape(TITLE)}</h1>
<p class="sub">{html.escape(SUBTITLE)}</p>
<p>An MCP App has two users. The human reads the pixels; the model reads the
schemas and the text. This is a short book about designing for both, with four
laws, teardowns you can run, and a testing method that costs an afternoon.</p>
<p>Pinned to core protocol <code>2026-07-28</code> and the MCP Apps extension
<code>io.modelcontextprotocol/ui</code>. Every figure regenerates from the
companion gallery in <a href="{REPO}">the repository</a>.</p>
</div>
</div>"""

    return hero + "\n" + "\n".join(sections)


def main() -> int:
    pages = collect()
    OUT.mkdir(parents=True, exist_ok=True)

    for p in pages:
        eyebrow = ""
        if p.number:
            kind = "Appendix" if p.part == "Appendices" else "Chapter"
            eyebrow = f'<p class="eyebrow">{kind} {p.number}</p>'
        summary = f'<p class="summary">{html.escape(p.summary)}</p>' if p.summary else ""
        body = (
            eyebrow
            + f"<h1>{html.escape(p.title)}</h1>"
            + summary
            + transform(pandoc(p.body))
        )
        (OUT / p.href).write_text(page_html(pages, p, body), encoding="utf-8")

    index = Page(path=Path("index"), slug="index", title="Contents", part="",
                 summary=SUBTITLE)
    (OUT / "index.html").write_text(
        page_html(pages, index, build_index(pages), extra_title="Contents"),
        encoding="utf-8",
    )
    (OUT / ".nojekyll").write_text("")

    words = sum(len(re.findall(r"[A-Za-z][A-Za-z'-]+", p.body)) for p in pages)
    print(f"{len(pages) + 1} pages, ~{words:,} words -> {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
