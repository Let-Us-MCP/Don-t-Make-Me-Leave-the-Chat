---
number: E
part: Appendices
title: "One App, End to End"
slug: appendix-e
summary: "The rate comparison built from nothing, with every decision in this book applied in order."
---

Everything in this book is a rule about one decision. This appendix makes all of
them at once, on one app, in the order you would actually meet them. The result
is the `compare_rates` app in the gallery, so every step here is checkable
against a file.

The task: somebody is comparing three loan quotes and wants to know which is
cheapest.

## 1. Should this exist at all

Chapter 1's three questions, answered honestly before anything is built.

*Does it need to be seen or read?* The answer is a ranking, which is a
computation rather than a picture, so the first question says write a sentence.
That is a real answer and it is worth pausing on: the first pass at this app
should be a tool with no UI at all.

*Will the user act on it?* Here is where it turns. The ranking depends on a
horizon nobody stated precisely, and the ranking *changes* with it: Northbank is
cheapest for three years, Cedar from four. A user who reads "cheapest over five
years" will immediately want to know about three, and asking costs a turn, a
tool call, and a wait, every time.

*Does the conversation already contain the answer?* Partly. The rates, the fees,
and the principal were all in the user's message. The horizon was an assumption.

Two out of three, with the middle one carrying real weight. Render, and the
render is going to be small.

So the server ships two tools. `compare_rates_text` answers in prose, because
that is genuinely the right answer to a one-shot question and Chapter 12's text
rung has to work anyway. `compare_rates` renders, because the horizon is worth
poking at.

## 2. What the model needs

Chapter 2, and this is where most of the work is, which surprises people.

The name is `compare_rates`: verb, object, guessable from the task. Not
`loan_analytics`, which names a product, and not `compare_rates_v2`, which
invites the model to wonder about v1.

The description is three sentences by the formula, and the second is the one
that matters:

<!-- listing: captured from `tools/list` -->
```
Show a comparison of the loan offers under discussion, ranked by total
cost over a horizon the user can adjust. Use when the user asks which
loan is cheapest, or wants to see how the answer changes if they pay
it off early.
```

That second sentence is what makes the tool reachable. Without it the model has
a definition and no trigger, and the app renders in demos and never in use.

The schema declares the one thing the tool can be asked for:

```javascript
inputSchema: {
  type: "object",
  properties: {
    horizonYears: {
      type: "integer", minimum: 1, maximum: 10, default: 5,
      description: "Starting comparison horizon. The user can change it in the app.",
    },
  },
}
```

Four decisions in six lines. The type and bounds stop a nonsense call before it
happens. The default means nobody is ever asked. And the description's last
clause tells the model not to re-call the tool when the user says "what about
four years", because the widget can handle that itself. That clause saves a turn
on most conversations this app appears in.

## 3. Compute once

Chapter 2's mechanical rule, and the reason this app has almost no JavaScript.

The server prices every horizon from one to ten years in one pass, and puts the
whole table in `structuredContent`:

<!-- listing: illustrative -->
```javascript
export function priceOffers(offers = OFFERS, principal = PRINCIPAL) {
  return offers.map((o) => {
    const totals = {};
    for (let y = 1; y <= 10; y++) totals[y] = totalOver(o, y, principal);
    return { lender: o.lender, apr: o.apr, fees: o.fees, monthly: ..., totals };
  });
}
```

Two consequences follow. The slider needs no round trip, because every value it
can select is already on the client. And no arithmetic happens twice, so the
number in the pixels and the number in the model's context are the same number
by construction rather than by discipline.

The `content` string is written from the same ranking, for a reader:

```javascript
text: `Comparing ${offers.length} offers over ${horizonYears} years. ` +
      `${ranked[0].lender} is cheapest at ${money(ranked[0].total)}. ` +
      `The user can change the horizon in the app.`,
```

Read that as somebody with no pixels. It contains the answer, the winner, the
number, and what the human can do next. In Claude Code, which does not render
apps, that sentence is the entire product, and Chapter 12 argues it deserves the
same care as the card.

## 4. What the human sees

Chapter 3's hierarchy, in three levels and nothing more.

Level one is the lender name, in the largest type on the card, with a `cheapest`
pill beside it. Level two is one line: the total, the horizon, and the fact that
fees and payoff are included, because that is what makes the number trustworthy.
Level three is the three rows, each carrying APR, monthly payment, and fees as a
subtitle, available to anyone who cares and invisible to anyone who does not.

The skeleton is drawn from the arguments, because the template renders before
the data exists:

```javascript
app.ontoolinput = function (params) {
  var y = (params.arguments || {}).horizonYears || years;
  document.getElementById("headline").textContent =
    "Pricing three offers over " + y + " years.";
  // three placeholder rows at the right height
};
```

That handler was missing from the first version of this app, and the omission
was invisible until Figure 6-2 photographed the moment it covers. A skeleton bug
does not throw; it just shows somebody an empty card for a second.

## 5. The one control

Chapter 4 and Chapter 5, arriving at the same answer from opposite directions.

Chapter 4 says the rates, fees, and principal came from the conversation, so
they are shown as facts rather than asked as fields, and a line at the bottom
says where they came from. Chapter 5 says every control has to earn its place,
and exactly one does: the horizon slider, because the user will act on it
repeatedly and the alternative costs a conversational turn each time.

Everything else that a loan tool might plausibly offer, an export button, an
amortisation tab, a currency selector, a date range, fails one of those two
tests. The over-built version in Figure 1-2 has all of them.

## 6. Telling the other user

Chapter 2's feedback rule, in eleven lines, and the difference between an app
people call smart and one they call broken.

```javascript
app.setContext(
  "Comparing over " + years + " years: " + best.o.lender + " is cheapest at " +
    money(best.total) + " total.",
  { horizonYears: years, cheapest: best.o.lender, totalCost: best.total }
);
```

Called on every render and on every slider change, because moving the slider is
something a person would say out loud. Now "so the credit union then?" three
turns later is answerable, and so is "draft the email with those numbers".

Note what is not written back: the slider's pixel position, whether the card has
focus, or how many times it moved. Chapter 7's split, applied.

## 7. Making it re-summonable

Chapter 7's contract and Chapter 8's addressing, which turn out to be the same
requirement.

`horizonYears` is an argument, so "compare those at three years" is expressible.
The model knows the current value, because it was written back. Together those
two facts mean the app can be re-summoned in the state the user left it, without
a URL, a route, or a back button, by somebody saying so.

This is the step that is easiest to skip and most expensive to retrofit, because
retrofitting it means changing a tool's schema, which Chapter 13 lists as a
breaking change to your address space.

## 8. Proving it

Chapter 11, in three tiers, all of which this app passes and one of which it
failed on the first run.

The static checks want a trigger clause, a non-empty schema, a `content` string
longer than a log line, and a `setContext` call somewhere in an app that binds
interactions. On the very first run this app was fine and eight of its
neighbours were not.

The widget checks want it to parse, connect, and answer the four states. The
skeleton state is the one it failed, and Figure 6-2 is what found it.

The model-in-the-loop suite wants the right tool chosen for the right phrasing,
and this is where the app taught the book something. Asked *which of these is
cheapest over five years*, the model called `compare_rates_text`, not the app.
The eval scored that a failure. The eval was wrong: a one-shot question with no
follow-up is exactly the case where Chapter 1 says prose wins, and the model was
applying the book's own first law more faithfully than the test suite that was
grading it. Asked *I want to see how the answer changes if I pay it off early*,
it called the app.

Which is the outcome to design for. Two tools, one prose and one rendered, and a
model that picks between them on whether the user is going to act.

## 9. Shipping it

Chapter 10 and Chapter 13, briefly, because most of it is already done.

The UI resource declares no external origins and no permissions, and asks for a
border, so the sentence *this app cannot send anything anywhere* is true and a
reviewer can verify it in one command without calling the tool. The app names
its source in the interface. Nothing about it resembles host chrome.

And the listing sells the job rather than the product: *compare loan offers by
total cost*, in the words somebody would use to ask.

## The whole thing, in order

1. Answer the three questions. Accept a "no" if you get one.
2. Write the description before the widget, with a sentence saying when.
3. Put in the schema every field the model could fill.
4. Compute the fact once, on the server, and return both renderings.
5. Draw the skeleton from the arguments.
6. Show the answer at level one, the reason at level two, and hide the rest.
7. Keep one control, and only if the user will act on it.
8. Write back what a person would have said out loud.
9. Make it re-summonable: argument in the schema, value in the context.
10. Run the static checks, the widget checks, and ten prompts.

Ten steps, one card, and about two hundred lines of code including the HTML.
