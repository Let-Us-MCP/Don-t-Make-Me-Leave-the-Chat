# Don't Make Me Leave the Chat - working notes

Live progress log. Updated as work lands.

**Target repo:** https://github.com/Let-Us-MCP/Don-t-Make-Me-Leave-the-Chat
(account `krimler`, email `yavan@outlook.com`)
**Pinned to:** core protocol `2026-07-28`, MCP Apps extension
`io.modelcontextprotocol/ui`
**Reference material:** `proto/modelcontextprotocol` (clone of the spec repo,
never committed), and Steve Krug's *Don't Make Me Think* as the framing text
(also never committed).

---

## House style (binding on every chapter)

1. **Krug's register.** Short, funny where it earns the laugh, direct address,
   strong claims followed by the evidence. Chapters open cold with the law.
2. **Teardowns are the argument.** Annotated renders, not prose descriptions of
   renders. Every one comes from the gallery.
3. **No em dashes.** Not one. `tools/lint_prose.py` enforces it.
4. **No AI slop.** Banned-phrase list, cadence budget, near-duplicate sentence
   detection across the whole book. Same linter.
5. **No invented anecdotes.** No "a client of mine once". Every example is a
   constructed exhibit in the gallery, labelled and runnable.
6. **xkcd figures** alongside the mechanism diagrams. Hand-drawn look, dry joke,
   real point.
7. **Everything runs.** Every figure regenerates. Every listing is extracted
   from the gallery.

## Architecture

```
book/            Markdown, one file per chapter, YAML front matter
figures-src/     xkcd/ cartoons, diagrams/ mechanism figures, cover.py
gallery/         the companion server: fixtures, registry, mcp, transports,
                 apps (before/after per archetype), mini host, evals, probe
docs/            GENERATED website (GitHub Pages)
tools/           build, capture, lint, check
```

**Figure pipeline.** Two families. Drawn figures are matplotlib scripts that
take an output path. Annotated renders are captured by
`tools/capture_figures.mjs`, which drives headless Chrome over the DevTools
Protocol, plays a scene from `gallery/host/scenes.js` in the mini host, and
screenshots the result.

**Website pipeline.** Markdown is the single source. `tools/build_site.py` runs
pandoc per file and wraps the output in a hand-written responsive template. No
Jekyll, no theme fighting.

---

## Progress

Legend: `[ ]` not started, `[~]` drafted, `[x]` drafted + linted + built

### Infrastructure
- [x] Repo skeleton, `.gitignore`, Makefile, licences
- [x] Prose linter: em dashes, slop, cadence, repetition, chapter length
- [x] Cross-reference checker: chapters, appendices, figures, orphans
- [x] Figure pipeline (matplotlib) and cover
- [x] Render camera (headless Chrome over CDP)
- [x] Website generator and template
- [x] GitHub Actions CI

### Gallery
- [x] Zero-dependency MCP server: initialize, server/discover, tools, resources
- [x] stdio and HTTP transports
- [x] App bridge (~130 lines) implementing the postMessage dialect
- [x] Mini host with a "what the model sees" pane
- [x] Figure camera page with annotation gutters
- [x] Seven before/after app pairs plus one prose-only tool
- [x] Model-as-user checks (`gallery/evals/`)
- [x] Server probe and host matrix data (`gallery/probe/`)
- [x] Verified end to end with Claude Code (`gallery/VERIFICATION.md`)

### Part 1 - Guiding Principles
- [x] Ch 1  Don't Make Me Leave the Chat
- [x] Ch 2  Your App Has Two Users
- [x] Ch 3  How People Actually Use Apps in Chat
- [x] Ch 4  Never Ask What the Conversation Already Knows
- [x] Ch 5  Omit Needless Widgets

### Part 2 - Things You Need to Get Right
- [x] Ch 6  The Machinery, Briefly
- [x] Ch 7  State, or Knowledge in the World versus in the Head
- [x] Ch 8  Navigation in Someone Else's House
- [x] Ch 9  Forms and Actions
- [x] Ch 10 Trust, Courtesy, and the Sandbox

### Part 3 - Making Sure You Got It Right
- [x] Ch 11 Testing on Ten Prompts a Day
- [x] Ch 12 Hosts Are the New Browsers

### Part 4 - Larger Concerns
- [x] Ch 13 Distribution, or Your Server Is Your Storefront

### Back matter
- [x] App A  The laws, on one page
- [x] App B  Host capability matrix, generated
- [x] App C  The ten-prompt test kit
- [x] App D  Gallery repository map

### Publish
- [x] Site builds
- [x] Pushed to GitHub, Pages enabled

---

## Decisions and their reasons

- **Zero-dependency gallery.** The book's code has to be readable in one
  sitting, and a design book that ships a build toolchain has lost the plot.
  The whole server is about 400 lines of Node with no imports outside `node:`.

- **The camera drives a real browser.** The alternative was hand-cropped
  screenshots, which drift silently. `tools/capture_figures.mjs` plays a scene
  and screenshots a DOM region, so a figure in the book is the same thing you
  get by clicking the scene in the mini host.

- **Annotations are drawn in the parent, measured in the child.** The camera
  cannot read into a sandboxed iframe and should not be able to. The bridge
  answers a development-only `ui/measure` request with a bounding box. The book
  keeps describing this constraint; the tooling had to obey it too.

- **Markdown source, not LaTeX.** The stated publish target is a website. One
  source, one converter, no parallel copies.

- **The evals found 20 errors in the gallery's own tools on their first run.**
  Written by somebody who had just finished writing the chapters telling you
  not to make those mistakes. That run is quoted verbatim in Chapter 11,
  because it is the most honest thing in the book.

- **Claude Code negotiated `2026-07-28` and refused three of our responses.**
  Missing `resultType` on list results, missing `ttlMs` and `cacheScope` on
  cacheable lists, missing `resultType` on tool results. None of those is in
  the Apps extension. They are core changes an apps developer hits on day one,
  and they are recorded in `gallery/VERIFICATION.md` rather than buried.

- **A mismatched quote made an app invisible, not broken.** The script never
  ran, so `ui/initialize` never fired, so the host waited forever and the
  widget sat there blank. `tools/check_apps.mjs` exists because of that.

## Open items

- Chapters run 1,100 to 1,900 words against a 2,000 to 2,500 target. A density
  pass is the next work: more mechanism, not more padding.
- No human usability sessions were run for this edition. Chapter 11 describes
  the method and claims no findings.
- Appendix B's host rows come from the MCP project's published matrix, not from
  tests run here. Stated in the appendix and in `VERIFICATION.md`.
