---
number: B
part: Appendices
title: "The Host Capability Matrix, Generated"
slug: appendix-b
summary: "Which hosts render MCP Apps, where the data came from, and how to regenerate it."
---

**Extension:** `io.modelcontextprotocol/ui`
**Checked:** 2026-08-18
**Source:** <https://modelcontextprotocol.io/extensions/client-matrix>

Host rows come from the MCP project's published extension support matrix, not from tests run in this repository. Every row carries its source and the date it was checked. Regenerate the appendix with `python3 tools/build_matrix.py`.

| Host | Renders MCP Apps | Notes |
|---|---|---|
| [Claude (web)](https://claude.ai) | yes |  |
| [Claude Desktop](https://claude.ai/download) | yes |  |
| [ChatGPT](https://chatgpt.com/) | yes | Also ships the Apps SDK, which predates the extension and differs in places. |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | yes |  |
| [Microsoft 365 Copilot](https://www.microsoft.com/microsoft-365-copilot) | yes |  |
| [Goose](https://block.github.io/goose/) | yes |  |
| [Postman](https://postman.com) | yes |  |
| [MCPJam](https://www.mcpjam.com/) | yes |  |
| [Cursor](https://cursor.com/) | yes |  |
| [Archestra.AI](https://www.archestra.ai/) | yes |  |
| [PostHog Code](https://posthog.com/code/) | yes |  |
| [Claude Code (CLI)](https://claude.com/claude-code) | no | Speaks core MCP and runs the gallery's tools. It is a terminal, so there is no iframe to render into: every app degrades to its content text. This is the fallback ladder's bottom rung, in a client many readers use daily. |

11 of 12 listed clients render MCP Apps.

## How to regenerate

```bash
python3 tools/build_matrix.py
```

The data lives in `gallery/probe/hosts.json`. Editing that file and re-running
is the whole workflow; nothing in this appendix is typed by hand.

## The half you can automate

Host support is somebody else's published fact. Server support is yours, and it
is probeable:

```bash
node gallery/probe/probe.js http://localhost:8931/mcp
```

The probe reports whether the server declares the extension, which tools carry a
`ui://` resource, what each app is allowed to reach over the network, and, most
usefully, how many of your apps return a text answer good enough for a host that
does not render apps at all. On the gallery it says 8 of 17, and the 9 that fail
are exactly the book's deliberately over-built "before" exhibits.

That last number is the one to watch. It is the fallback ladder from Chapter 12,
measured.
