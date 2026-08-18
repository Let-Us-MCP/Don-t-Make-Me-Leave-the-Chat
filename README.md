# Don't Make Me Leave the Chat

### *A common sense approach to MCP Apps*

**Read it online: [let-us-mcp.github.io/Don-t-Make-Me-Leave-the-Chat](https://let-us-mcp.github.io/Don-t-Make-Me-Leave-the-Chat/)**

A short design book about interfaces that render inside somebody else's
conversation. The official docs own the quickstart. *Patterns of MCP App
Architecture* owns the fleet. Nobody owned the question that comes before
either: should this be an app at all, and what makes it a good one?

Written against core protocol **`2026-07-28`** and the MCP Apps extension
**`io.modelcontextprotocol/ui`**.

---

## The thesis

An MCP App has two users. The human reads the pixels. The model reads the tool
names, the descriptions, the schemas, and the text you write back. Affordances,
feedback, and error design have to work for both, or one of your users is
operating blind.

Four laws follow from that, and they are on
[one page](https://let-us-mcp.github.io/Don-t-Make-Me-Leave-the-Chat/appendix-a.html).

## What is in here

| | |
|---|---|
| **13 chapters + 4 appendices**, four parts | ~32,000 words |
| **[`gallery/`](gallery/)** | One MCP server, 16 apps, no runtime dependencies |
| **23 annotated renders** | Captured headlessly from the gallery, regenerate with one command |
| **16 drawn figures** | matplotlib, generated from `figures-src/` |
| **Model-as-user checks** | 22 tools checked in under a second |

## Quick start

```bash
git clone https://github.com/Let-Us-MCP/Don-t-Make-Me-Leave-the-Chat
cd Don-t-Make-Me-Leave-the-Chat

node gallery/serve.js        # mini host at localhost:8931, MCP at /mcp
```

Open <http://localhost:8931>. The sidebar lists every scene in the book. Each
one plays a short transcript, renders the app in a sandboxed frame at a width
you can drag, and shows what the model sees in the right-hand column.

The before-and-after pairs are the argument. Click one, then the other.

Node 18 or later. Nothing else for the gallery.

### With Claude Code

The repository ships a `.mcp.json`:

```bash
claude -p "I've got three quotes on a \$30,000 loan: Northbank 6.24% no fee, \
  Cedar 4.35% with a \$1,400 fee, Harbor 5.6% with \$500. Which is cheapest \
  over five years, and does that change at three?" \
  --allowedTools "mcp__gallery__compare_rates_text"
```

```
Cedar Credit Union is cheapest over five years at $34,835 total.
Yes, it flips at three years: Northbank wins at $34,130, because Cedar's
$1,400 in fees only pays off over a longer horizon.
```

That flip is why the fixed app in Chapter 1 has a slider and the over-built one
does not. See [`gallery/VERIFICATION.md`](gallery/VERIFICATION.md) for the full
record, including three core-protocol fixes it took to get a real client to
connect, and what is **not** verified.

## Contents

**Part 1, Guiding Principles.** Four laws. Don't make me leave the chat. Your
app has two users. Never ask what the conversation already knows. Omit needless
widgets. One teardown each.

**Part 2, Things You Need to Get Right.** The machinery in one chapter, then
state, navigation, forms and actions, and trust.

**Part 3, Making Sure You Got It Right.** Five humans and an afternoon, plus the
half that is new: does the model invoke your app, pass what it knows, and
answer afterwards. Then the host compatibility reality.

**Part 4, Larger Concerns.** Distribution, and the laws on one page.

## Building

```bash
python3 tools/build_site.py        # the website into docs/
python3 tools/build_figures.py     # the drawn figures
node tools/capture_figures.mjs     # the annotated renders, via headless Chrome
python3 tools/build_matrix.py      # Appendix B from gallery/probe/hosts.json
python3 tools/lint_prose.py        # no em dashes, no slop, no repetition
python3 tools/check_refs.py        # every cross-reference and figure resolves
node tools/check_apps.mjs          # every app parses and connects
node gallery/evals/run.js --all    # the model-as-user checks
make                               # all of it
```

Figures need `.venv` with matplotlib. Renders need Chrome. The website needs
pandoc.

## Repository layout

```
book/            Markdown source, one file per chapter
  chapters/        ch01..ch13
  appendices/      appA..appD (appB is generated)
  frontmatter/     preface, how to read, about
figures-src/     drawn figures: xkcd cartoons, mechanism diagrams, the cover
gallery/         the companion server, apps, mini host, evals, and probe
docs/            the generated website (GitHub Pages)
tools/           build, capture, lint, and check scripts
```

## Contributing

Corrections welcome, and **reproduction failures most of all**. A figure you
cannot regenerate or a check you cannot reproduce is the most useful bug report
available. Include your platform, your Node and Python versions, and the command
you ran.

## Licence

Prose: copyright © 2026 Krimler. All rights reserved.

Gallery, tools, and figure sources: MIT. Copy the patterns into your own work
without asking.

The cover is generated by `figures-src/cover.py`, so its provenance is
unambiguous and no third-party artwork is involved.
