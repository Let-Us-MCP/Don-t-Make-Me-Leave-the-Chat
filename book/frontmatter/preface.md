---
slug: preface
title: "Preface"
part: Front matter
summary: "What this book is for, who it is for, and what it deliberately does not cover."
---

There are three books on this shelf and they have a division of labour.

*High-Performance MCP Applications* teaches the protocol down to the bytes on
the wire, then spends that understanding on latency, context, and cost. It is
the book for when you need to know what is actually happening.

*Patterns of MCP App Architecture* is the fleet book. Forty servers, twelve
teams, versioning, and the failure modes that only appear at scale.

This one is the judgment book, and it is the shortest on purpose. It is about
the question that comes before either of the others: should this be an app at
all, and if so, what makes it a good one?

## The framing

The text this book is modelled on is Steve Krug's *Don't Make Me Think*, the
short, funny, screenshot-driven usability book that taught a generation of web
developers the difference between a page that works and a page that merely
exists.

Its engine had three parts, and all three are transplanted here. A handful of
memorable laws, stated in plain language. Annotated teardowns doing the
arguing. And testing so cheap that nobody has an excuse to skip it.

What is new is the second user. An MCP App has two of them: the human reads the
pixels, and the model reads the schemas and the text. Affordances, feedback, and
error design have to work for both, or one of your users is operating blind. No
prior usability book had an AI as a co-user. This one is organised around it.

## Who this is for

Anybody about to build an interface that renders inside somebody else's
conversation. You do not need to have read the other two books. You need to have
read a tool description at some point and formed an opinion about it.

If you are a designer, the chapters you will find least familiar are 2, 6, and
7, because they are about the user you cannot see. If you are a backend
engineer, it is 3 and 5, because they are about the user you can.

## What is pinned

Core protocol revision `2026-07-28`, and the MCP Apps extension
`io.modelcontextprotocol/ui`, whose specification lives in the ext-apps
repository. Mechanics appear only where judgment needs them, and Chapter 6 is
the one place where plumbing is explained on its own terms.

The extension will move. Where a field name in this book disagrees with the
specification, the specification is right.

## House rules

**Everything runs.** The gallery is a working MCP server with seventeen apps, no
runtime dependencies, and a mini host that renders them. Every annotated figure
in this book is captured from it headlessly, by a script in the repository, and
regenerates with one command.

**No em dashes, and no AI slop.** Both are enforced by a linter that runs in CI,
because good intentions do not survive a long night.

**No invented anecdotes.** Every teardown is a constructed exhibit in the
gallery, labelled as such, and runnable. There is no "a client of mine once".

**Chapters are short.** Two thousand words and change. Krug's were shorter, and
that was most of why they worked.

## Thanks, and a warning

The MCP Apps extension is the work of a large group of people across several
companies, and the specification is unusually readable for a document written by
committee. Read it after this book.

The warning: this book has opinions, and states them without hedging, because
hedged advice is not actionable. Where the reasoning is given, argue with it.
Where the gallery disagrees with the book, the gallery is the one you can run.
