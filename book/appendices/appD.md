---
number: D
part: Appendices
title: "Gallery Repository Map"
slug: appendix-d
summary: "Every figure traced to the app and the command that produced it."
---

The gallery is one MCP server with sixteen apps, eight of them deliberately
over-built so the teardowns have something to tear down. It has no runtime
dependencies. Node 18 or later is the whole requirement.

## Running it

```bash
node gallery/serve.js               # mini host at :8931, MCP at /mcp
node gallery/stdio.js               # the same server over stdio
node gallery/evals/run.js --all     # the model-as-user checks
node gallery/probe/probe.js         # probe any server for apps support
node tools/check_apps.mjs           # every app parses and connects
node tools/capture_figures.mjs      # regenerate every annotated render
python3 tools/build_figures.py      # regenerate every drawn figure
python3 tools/build_site.py         # rebuild the website
```

With Claude Code, from the repository root, using the checked-in `.mcp.json`:

```bash
claude -p "Which of those loans is cheapest over five years?" \
  --allowedTools "mcp__gallery__compare_rates_text"
```

`gallery/VERIFICATION.md` records what that produced, and what is not verified.

## Layout

```
gallery/
  fixtures.js       every number the gallery shows, and the loan pricing maths
  registry.js       one entry per tool: description, schema, handler, ui path
  mcp.js            the protocol slice: initialize, discover, list, call, read
  serve.js          HTTP transport plus the mini host
  stdio.js          stdio transport, the one Claude Code runs
  apps/
    _base.css       tokens and layout primitives, inlined at serve time
    _bridge.js      the app side of the postMessage dialect, about 130 lines
    <archetype>/before.html   the teardown exhibit
    <archetype>/after.html    the fixed version
  host/
    host.js         the host side: sandboxed frames, routing, consent surface
    index.html      the interactive mini host, with a "what the model sees" pane
    capture.html    the same, arranged for the camera, with annotation gutters
    scenes.js       one scene per figure: transcript, call, annotations
  evals/            the model-as-user checks
  probe/            the server probe and the host matrix data
```

## Figures, traced

Every annotated render is a scene in `gallery/host/scenes.js`. The scene id is
the argument to the camera.

| Figure | Scene | Tool | What it shows |
|---|---|---|---|
| 1-1 | `rate-prose` | `compare_rates_text` | The task answered with no app at all |
| 1-2 | `rate-before` | `compare_rates_suite` | The kitchen sink, five violations marked |
| 1-3 | `rate-after` | `compare_rates` | The right-sized card |
| 2-1 | `canvas-before` | `budget_canvas` | A canvas the model cannot read |
| 2-2 | `canvas-after` | `allocate_budget` | The same interaction, written back |
| 3-1 | `dash-before` | `ops_overview` | Twelve tiles, no verdict |
| 3-2 | `dash-after` | `service_status` | Verdict, reason, three numbers |
| 4-1 | `form-before` | `new_expense` | Nine fields, seven already answered |
| 4-2 | `form-after` | `confirm_expense` | One question, four facts shown |
| 5-1 | `picker-before` | `search_flights` | A web page wearing a chat costume |
| 5-2 | `picker-after` | `pick_flight` | Three options, one tap |
| 7-1 | `tracker-before` | `deploy_tracker` | A tracker that quietly lies |
| 7-2 | `tracker-after` | `deploy_status` | Read time, refresh, write-back |
| 8-1 | `viewer-before` | `open_document` | A browser rebuilt in a paragraph |
| 8-2 | `viewer-after` | `find_clause` | Navigation resolved before the render |
| 9-1 | `form-validation` | `confirm_expense` | Validation stated before it is enforced |
| 10-1 | `trust-before` | `session_check` | A widget shaped like phishing, inert |
| 10-2 | `trust-after` | `reconnect_billing` | The trustworthy twin |

Regenerate one:

```bash
node tools/capture_figures.mjs rate-after
```

The drawn figures live in `figures-src/`. Cartoons are `figures-src/xkcd/*.py`,
mechanism diagrams are `figures-src/diagrams/*.py`, and the cover is
`figures-src/cover.py`. All of them take an output path as their one argument,
so any of them runs on its own.

## How the annotations work

The camera cannot read into a sandboxed iframe, and it should not be able to. So
it asks. The gallery's bridge answers a development-only `ui/measure` request
with an element's bounding box, and the camera draws the callout and the leader
line in the parent document.

This is the same constraint the book keeps describing, showing up in the
tooling: everything crosses the boundary as a message, or it does not cross.
