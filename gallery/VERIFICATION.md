# What was actually verified, and how

Everything in this file was run on the machine described below. Where something
could not be verified, that is said plainly rather than left implied.

**Platform.** macOS 15 (Darwin 24.6), Apple Silicon, Node 26.0.0, Chrome 151,
Claude Code 2.x.

---

## 1. The server speaks MCP to a real client

`claude mcp list`, with `.mcp.json` in the repository root and the server
approved for the project:

```
gallery: node gallery/stdio.js - ✔ Connected
```

Getting there took three fixes, and they are worth recording because every one
of them is a thing a reader will hit.

Claude Code negotiated revision `2026-07-28`, which changed what a valid result
looks like. In order:

| Symptom | Cause | Fix |
|---|---|---|
| `tools fetch failed - missing required resultType` | list results must declare completeness | `resultType: "complete"` on every list |
| `expected number, path ["ttlMs"]` and `expected one of "public"|"private"` | list results are cacheable and must say for how long | `ttlMs` and `cacheScope` on every list |
| `tools/call` returned a malformed result | tool results declare completeness too | `resultType: "complete"` on every tool result |

None of these is in the MCP Apps extension. They are core-protocol changes that
an apps developer meets on day one, which is why they are recorded here rather
than in the book's chapters.

## 2. The model calls the tool and answers from it

```
$ claude -p "Using only the gallery MCP server, answer in exactly two lines:
  (1) which lender is cheapest over five years and the total, (2) whether that
  changes at three years and who wins there." \
  --allowedTools "mcp__gallery__compare_rates_text"
```

```
Cedar Credit Union is cheapest over five years at $34,835 total (vs. Harbor
Direct $34,965 and Northbank $35,000).
Yes, it flips at three years: Northbank wins at $34,130, ahead of Harbor Direct
$34,193 and Cedar $34,247 - Cedar's $1,400 in fees only pays off over a longer
horizon.
```

Those six numbers come from `gallery/fixtures.js`. The flip between year three
and year four is the reason the fixed app in Chapter 1 has a slider.

## 3. The arithmetic is right

Asked the same question with the server disconnected, Claude computed the
amortisation independently and produced $34,834 / $34,965 / $35,004 at five
years, against the fixtures' $34,835 / $34,965 / $35,000. It also estimated the
break-even against Northbank at roughly 44 months, and the fixtures put the
crossover between months 36 and 48.

An independent calculation agreeing to within rounding is not a proof, but it is
a great deal better than nobody having checked.

## 4. Every app parses and connects

```
$ node tools/check_apps.mjs
32 scripts across 16 apps, 0 problem(s)
```

This check exists because of a real bug. A mismatched quote in
`picker/after.html` meant the app's script never ran, so it never called
`ui/initialize`, so the host waited forever and the figure never captured. A
syntax error inside a sandboxed iframe is invisible from the outside: the widget
just sits there being blank.

## 5. The model-as-user checks pass

```
$ node gallery/evals/run.js --all
21 tools checked, 0 error(s), 0 warning(s)
```

On the first run this reported **20 errors and 15 warnings**, against tools
written by somebody who had just finished writing the chapters telling you not
to make those mistakes. Chapter 11 lists what it found.

## 6. Every figure regenerates

```
$ node tools/capture_figures.mjs
18 figures captured with Chrome/151.0.7922.138
$ python3 tools/build_figures.py --force
16 built, 0 up to date, 0 failed
```

## What is not verified

- **Rendering in shipping hosts.** The annotated renders come from the gallery's
  own mini host, which implements the parts of the postMessage dialect this book
  argues about. It is not Claude, ChatGPT, VS Code, or Goose. Appendix B says
  what each of those supports and where that information comes from, and it is
  drawn from published capability matrices rather than from tests run here.
- **The exact field names under `_meta.ui`.** The gallery follows the ext-apps
  specification, which is the normative document. If a name has changed since
  this was written, the specification is right and this repository is wrong.
- **Human usability findings.** Chapter 11 describes a method. No sessions were
  run for this edition, and no claim is made about what five users would find.
