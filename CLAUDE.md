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

- **The first draft read like LinkedIn, and it was measurable.** Short
  paragraphs, bulleted assertions, a bolded lead-in every few lines, a heading
  every 157 words. `tools/audit_density.py` put numbers on it and
  `tools/measure_reference.py` measured the framing text to get a target:
  *Don't Make Me Think* runs 46.4 words per paragraph across 803 blocks, and
  the draft ran 26.5. Every chapter was rewritten against that number. The book
  now runs 61.4 words per paragraph, 0% of lines are bullets, and bold lead-ins
  went from 170 to 16. The metric that mattered most was "longest run of
  paragraphs broken only by a heading", because a chapter that never runs five
  paragraphs together never argues anything.

- **One threshold in the audit was invented and had to be corrected.** The
  header-interval flag was set at 280 words on instinct. Measuring the framing
  text put it near 200, which meant the tool was flagging the book for matching
  its own model. Threshold moved to 170 and the docstring now says where every
  number came from.

- **The capability ladder figure found three bugs by existing.** Teaching the
  mini host to claim less than it supports produced Figure 12-1, and building it
  showed that the gallery's own tracker had no skeleton, never checked
  `toolCalls`, and that a zero-height report from a freshly-appended iframe
  collapsed a working widget to six pixels. All three are in
  `gallery/VERIFICATION.md`. The last one was intermittent in exactly the way
  that survives manual testing: the first frame on a page was always fine.

- **`tools/audit_style.py` found zero deferrals and one chapter over budget on
  contrastive phrasing.** Chapter 12 used "rather than" fifteen times, which
  reads as arguing with somebody who is not in the room. Rewritten to eight.

- **The specification audit found two real errors.** `csp`, `permissions`, and
  `domain` live on the UI **resource**, not on the tool, and the gallery had
  them on the tool: an inspector running `--app-info` would have reported an app
  with no policy at all. And `preferredFrameSize` was invented; nothing in the
  spec mentions it. Both fixed, and `tools/check_claims.py` now verifies fifteen
  protocol claims against `proto/` and fails if we use a field the spec has
  never heard of.

- **The audit also found things the book was missing.** `prefersBorder` is a
  real resource field, which makes Chapter 10's "be visibly separate" a protocol
  feature rather than only taste; the gallery's phishing exhibit now declines it
  on purpose, so the probe shows the difference without rendering anything. And
  the elicitation spec says servers **MUST NOT** use form mode for credentials
  and **MUST** use URL mode, which is the strongest sentence available for
  Chapter 10's argument and was not in the draft.

- **`tools/check_listings.py` closed a promise the book was breaking.** Of 41
  listings, 11 are extracted, 11 are captured output, and 19 are illustrative,
  and every one now says which on the rendered page. Writing it found two
  listings that had been quietly paraphrased and presented as extracted, and six
  that I then mislabelled as illustrative when they were in fact real.

- **`tools/check_counts.py` earned itself within an hour.** Adding the wizard app
  for Figure 8-3 moved six numbers the prose asserts, and the checker caught all
  six before the commit. It skips fenced blocks, because captured output is a
  record of a moment and is allowed to disagree with the present.

- **The cross-model run produced the book's best finding.** The same thirty
  prompts against Claude Code and gpt-5-nano scored 15/15 and 13/15 on
  invocation, 8/9 and 9/9 on refusal. Four prompts got opposite verdicts and one
  failed on both, which is the separation that makes a second model worth the
  few dollars: a failure surviving two families is a description bug, a failure
  on one is tuning. Trying to fix the shared bug traded invocation against
  refusal in the same direction on both models for every phrasing, which is not
  a tuning problem: `compare_rates_text` and `compare_rates` do one job and a
  sentence cannot separate them. They exist as Chapter 1 exhibits; a real server
  would ship one. Written up in Chapter 5, Chapter 12, and Appendix C.

- **A CI job hung for six hours** on `apt-get install nodejs` with its output
  redirected, so nothing showed why. Replaced with `setup-node`, and every job
  now carries `timeout-minutes: 10`.

## Open items
- No human usability sessions were run for this edition. Chapter 11 describes
  the method and claims no findings.
- Chapters run 1,543 to 2,902 words, one flagged as slightly under target and
  left there instead of padded.
- **The book is still shorter than its framing text.** Measured:
  *Don't Make Me Think, Revisited* is about 43,250 words; this is about 32,300.
  The outline claimed the framing book was shorter than 28-32k, which the
  measurement disproves. Coverage is complete against the outline, so the gap is
  compression instead of omission, but a fourth pass adding worked examples
  would close it honestly. Currently 38,605 against 43,250, a gap of 11%.
- Chapter 3 runs 2,897 words against a 2,000 to 2,500 target. It is coherent
  (everything in it is about what the human experiences) and under the 3,200
  ceiling, so it is being left alone rather than split into a fourteenth chapter
  that would renumber thirty cross-references.
- Every chapter now carries at least one annotated render.
- No render has been captured from an iframe-capable shipping host. The evals
  ran against Claude Code, which is real and is a terminal. Closing this needs a
  Claude or ChatGPT account plus a tunnel to the gallery, which is an account
  task rather than a code task.
- `find_clause` still renders a viewer when asked to draft an email, on Claude
  but not on gpt-5-nano. Left as a documented tuning difference.
- Appendix B's host rows come from the MCP project's published matrix, not from
  tests run here. Stated in the appendix and in `VERIFICATION.md`.
