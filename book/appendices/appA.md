---
number: A
part: Appendices
title: "The Laws, on One Page"
slug: appendix-a
summary: "The tape-to-your-monitor sheet."
---

::: {.law data-n="1"}
Don't make me leave the chat.
:::

Your app is a guest inside somebody else's flow. The conversation holds the
context, the momentum, and the model's working state, and breaking it costs all
three.

**Before you render, three questions.**

1. Does this need to be **seen**, or just **read**? Shape and comparison are
   seen. A value, a status, a verdict are read.
2. Will the user **act** on it, or just **glance**? Glances want billboards, not
   cockpits.
3. Does the conversation **already contain the answer**?

Zero out of three: write the sentence. One: think hard. Two or three: render,
and make it count.

---

::: {.law data-n="2"}
Your app has two users. One reads pixels. The other reads schemas.
:::

**The model's affordances** are the tool name, the description, the input
schema, and the returned `content`. Write the description as though it were the
only thing you shipped.

**The model's feedback** is `ui/set-context`. Any state change a user would
mention out loud, mention to the model.

**One source, two renderings.** Compute the fact once. `content` for the model,
`structuredContent` for the app.

**The review question:** what does the model see when this renders?

---

::: {.law data-n="3"}
Never ask what the conversation already knows.
:::

A field the model can fill is a field the user never sees. Your input schema is
the list of questions you are choosing not to ask.

- **Prefill** from arguments and context.
- **Show** what you assumed, as facts on screen.
- **Say** where it came from, in one line.
- **Correct** in a labelled disclosure, closed by default.

Every control you add is a consent prompt you might have added, and consent
prompts are a shared resource.

---

::: {.law data-n="4"}
Omit needless widgets.
:::

**The six archetypes.** Picker, form, dashboard, viewer, tracker, canvas. Know
which one you are building. Two fighting is a sign to split rather than
compress.

**Three levels of hierarchy.** Verdict. Reason. Everything else, behind a
disclosure.

**Zero is a valid answer.** A verdict is a sentence. A small table is Markdown.
A structured question is an elicitation.

---

## The load-bearing details

**State.** Presentation in the widget, decisions and outcomes in the context. The
model can act between your renders, so timestamp what you show, decay visibly,
and make your tool safe to call again.

**Navigation.** The sentence is the address, the schema is the address space, the
transcript is the history, one line of text is the breadcrumb. Navigation inside
your widget is usually search done badly.

**Actions.** One rule, three renderings: schema for the model, message for the
human, enforcement on the server. Errors are instructions, not verdicts. Confirm
only when the confirmation carries information. Ship the undo, because one of
your users pressed the button on an inference.

**Trust.** Never look like the host. Draw a boundary, name yourself, leave system
language alone. Declare the smallest CSP you can, then say so where somebody
will read it. Your `content` text is your accessible rendering.

**Testing.** Five humans, three tasks, one afternoon, fix something after each
session. Then the other user: does the model invoke you, pass what it knows, and
answer afterwards.

**Hosts.** Five rungs on the ladder: full app, no callbacks, static preview,
content text, nothing. Most of your users get the fourth one. Design it.
