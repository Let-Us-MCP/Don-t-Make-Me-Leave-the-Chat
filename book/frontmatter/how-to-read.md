---
slug: how-to-read
title: "How to Read This Book"
part: Front matter
summary: "Four parts, thirteen short chapters, and three ways through."
---

## The shape

**Part 1, Guiding Principles.** Four laws, five chapters, one teardown each. If
you read nothing else, read this and Appendix A.

**Part 2, Things You Need to Get Right.** The load-bearing details. Mechanics,
state, navigation, forms and actions, trust. Chapter 6 is the only place where
plumbing gets explained on its own terms, and it exists so no other chapter has
to stop and do it.

**Part 3, Making Sure You Got It Right.** Testing, doubled for two users, and
the compatibility reality.

**Part 4, Larger Concerns.** Distribution, and the laws restated on one page.

## Three ways through

**The afternoon.** Chapter 1, Chapter 2, Appendix A. About forty minutes, and it
is most of the argument.

**The build.** Read Part 1 in order, then Chapter 6, then the chapter matching
the archetype you are building: forms is 9, dashboards is 3, anything with state
is 7, anything with navigation is 8. Then Chapter 11 before you ship.

**The review.** Chapter 2 for the design review question, Chapter 11 for the
triage, Appendix C for the session script.

## Running the gallery

Every figure in this book comes from a repository you can clone.

<!-- listing: illustrative -->
```bash
git clone https://github.com/Let-Us-MCP/Don-t-Make-Me-Leave-the-Chat
cd Don-t-Make-Me-Leave-the-Chat
node gallery/serve.js
```

Open <http://localhost:8931>. The sidebar lists every scene in the book by
chapter. Each one plays a short transcript, renders the app in a sandboxed frame
at a width you can drag, and shows what the model sees in the right-hand column.

The before-and-after pairs are the point. Click one, then the other.

## Conventions

Figures numbered `1-1`, `1-2` and so on are captured from the gallery. The
figure caption names the tool that produced them, and Appendix D maps every one
to its scene and the command that regenerates it.

Hand-drawn figures make one argument each and are drawn by a script in
`figures-src/`.

Every listing says where it came from, because a book that claims its code runs
should be checkable on that claim. A block with no tag is **extracted**: it
appears verbatim in the repository, and `tools/check_listings.py` fails the
build if it stops doing so. A block tagged *captured output* is the real result
of the command named beside it, and `tools/check_captured.py` re-runs that
command and fails if the output has drifted. A block tagged *recorded output* was
real once, from a state the repository has moved past, and is quoted because the
past state is the point. A block tagged *illustrative* is a shape rather than a
file: a wire message, a sketch, or in one case a deliberately fictional registry
listing.

Writing those checkers found two listings that had been quietly paraphrased and
presented as extracted, six more that were mislabelled, and one number quoted as
live evidence that had gone stale the moment the gallery grew an app. All of
which is the sort of thing they exist to catch.

If an extracted listing looks too short to be real, it is real, and it is short
because the gallery is small on purpose.
