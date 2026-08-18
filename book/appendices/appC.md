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

```bash
claude -p "<prompt from the suite>" \
  --allowedTools "mcp__<server>__<tool>" \
  --output-format json
```

Read `num_turns` and the tool calls out of the JSON. An invocation check is
whether your tool appears. A readback check is whether the follow-up answer
matches what the widget showed.

Ten prompts, three runs, one app: a few dollars and about four minutes.

## The triage

In order, and resist reordering it:

1. Things that stop the model calling you.
2. Things that leave the model wrong afterwards.
3. Things that make the human answer a question twice.
4. Everything else, including everything you can see.
