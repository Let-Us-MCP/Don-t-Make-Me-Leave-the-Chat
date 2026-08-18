---
number: C
part: Appendices
title: "The Ten-Prompt Test Kit"
slug: appendix-c
summary: "Scripts, task templates, and scoring sheets for Chapter 11's method."
---

Everything here is meant to be copied and edited. None of it needs a budget.

## The human session, in one page

**Time:** one afternoon. **People:** five, recruited loosely. **Watchers:**
whoever you can drag in.

**Before.** Write three tasks in the user's language. Not "use the compare rates
app". Something like: *You are choosing between three loan offers. Work out which
one costs you least if you keep it for five years.*

**During, for each person, twenty minutes.**

1. Two minutes: who are you, what do you do, how often do you use this kind of
   assistant.
2. Fifteen minutes: three tasks, thinking aloud, no help.
3. Three minutes: what was confusing, what did you expect to happen.

**Record for each task:**

| Field | Note |
|---|---|
| What they typed | Verbatim. This is your description's test suite. |
| Did the app render | If not, the description is the finding. |
| Did they notice it | Watch the eyes, not the mouse. |
| Which controls they touched | Untouched after five sessions is deletable. |
| Where they stalled | Timestamp it. |
| Did they finish | Yes, no, or gave up and asked in words. |

**After each session,** fix one thing. Five sessions with four fixes between
them beats five sessions and a report.

## The four-minute viewport check

Run this before you ship. It takes four minutes and it catches most of it. Set
the frame to 380 pixels and read the widget: can you get the answer without
scrolling? Set it to 320, because somebody is on a small phone with large system
text. Replace every string with the longest one in your data and look for
anything that wraps to three lines or clips. Switch the host to dark, check that
nothing has gone invisible and that your background is painted with a token
rather than a hex code, then switch it back while the widget is on screen and
see whether it followed. Remove the data and ask whether the skeleton is a
screen or an accident. Then open every disclosure and confirm the height report
updated. The gallery's mini host has a width slider and a theme toggle above the
transcript for exactly this loop.

## The ten prompts, per app

Five that should invoke, phrased differently:

1. The obvious phrasing, the way your docs would say it.
2. A vague phrasing with the goal but not the mechanism.
3. A phrasing using the user's vocabulary rather than yours.
4. A phrasing embedded in a longer request with other work in it.
5. A follow-up phrasing, where the context is in earlier turns.

Three that should not invoke:

6. An adjacent task another tool should handle.
7. A near miss: same domain, different intent.
8. A question the model should answer from context without any tool.

Two readback checks, run after a successful render:

9. A question that depends on what the widget shows.
10. A question that depends on what the user did in the widget.

Score each as invoked / not invoked / wrong tool, and each readback as correct /
hedged / wrong. Run the suite three times, because model runs are not
deterministic, and look at rates rather than single results.

## The static checks

These need no model and run in under a second. The gallery's implementation is
`gallery/evals/checks.js`.

| Check | Fails when |
|---|---|
| `no-trigger` | The description never says when to reach for the tool. |
| `empty-schema` | No input properties, so there is exactly one address. |
| `bare-property` | A property has no description, enum, or default. |
| `log-line` | `content` is under nine words, so it is a log rather than an answer. |
| `no-writeback` | The app binds interactions and never calls `setContext`. |
| `no-size` | The app never reports its height. |
| `no-undo` | A mutating tool names no way to reverse itself. |
| `run-throws` | The handler throws on its own declared sample arguments. |

Run:

```bash
node gallery/evals/run.js --all
```

## The model-in-the-loop run

Against a host you already have:

<!-- listing: illustrative -->
```bash
claude -p "<prompt from the suite>" \
  --allowedTools "mcp__<server>__<tool>" \
  --output-format json
```

Read `num_turns` and the tool calls out of the JSON. An invocation check is
whether your tool appears. A readback check is whether the follow-up answer
matches what the widget showed.

Ten prompts, three runs, one app: a few dollars and about four minutes.

## Wiring it into CI

The static checks belong on every commit, because the things they catch are
edits somebody makes at five o'clock.

```yaml
- name: Every app parses and connects
  run: node tools/check_apps.mjs

- name: Model-as-user checks
  run: node gallery/evals/run.js --all
```

Two jobs, no dependencies, about twenty seconds, and what they buy is that the
class of bug which is invisible in review stops reaching main. The invisible one
is worth naming: a mismatched quote in one of the gallery's apps meant its script
never ran, so it never called `ui/initialize`, so the host waited forever and the
widget rendered as an empty box. No error appeared anywhere, not in the server
log, not in the host, not in a test, because a syntax error inside a sandboxed
iframe is silence. `check_apps.mjs` exists because of that afternoon and it now
parses every app's script before anything else runs.

The model-in-the-loop suite does not belong on every commit, because it costs
money and it is non-deterministic. Run it nightly, and on any change to a tool
description, which is where invocation regressions come from and where nobody
thinks to look.

## Do not let the eval grade itself

One more finding, and it is a methodological one worth inheriting.

The first version of this harness ran `claude -p` from the repository root. The
model under test read `gallery/evals/prompts.json`, worked out that it was being
scored, and said so in its answer: the probe had been appended to its message,
so it called the tool knowing which call was the graded one, which made the pass
evidence of nothing.

It was right, and the harness was wrong. An eval whose subject can read the
answer key measures file access rather than trigger phrasing. The runner now
executes from a scratch directory containing nothing but an `.mcp.json` pointing
at the server, so the subject gets the tools and no context about the test.

If you build one of these, check what your subject can see. Ours could see
everything, because it ran where the repository was, which is the most natural
and most wrong place to put it.

## Running it against a second model

The suite is data, so it can be pointed at more than one model. The gallery
ships two runners over the same `prompts.json`.

`gallery/evals/model.mjs` drives Claude Code, which is a host rather than an
API, so it exercises the real path a reader is likely to ship on. Its weakness
is that Claude Code's JSON output does not enumerate tool calls, so the runner
has to ask the model to report what it called, and a self-report is weaker
evidence than a trace.

`gallery/evals/openai.mjs` sends the same prompts to the OpenAI API with the
gallery's tools converted to function definitions. The tool choice comes back in
the response, so nothing is self-reported. It reads the tool list locally over
stdio, so no tunnel and no public URL are involved, and it picks the cheapest
chat model the key can actually see rather than trusting a price table baked
into the script.

<!-- listing: illustrative -->
```bash
OPENAI_CONF=/path/to/your.conf node gallery/evals/openai.mjs --list-models
OPENAI_CONF=/path/to/your.conf node gallery/evals/openai.mjs
```

Running both is worth the few dollars for one reason. A description that scores
well on one model family and badly on another is tuned rather than clear, and
you cannot tell which you have written until you try the second one.

## The triage

In order, and resist reordering it:

1. Things that stop the model calling you.
2. Things that leave the model wrong afterwards.
3. Things that make the human answer a question twice.
4. Everything else, including everything you can see.
