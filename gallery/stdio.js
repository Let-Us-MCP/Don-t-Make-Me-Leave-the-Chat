#!/usr/bin/env node
/* stdio transport. This is the entry point in .mcp.json, so it is the one
 * Claude Code runs. Newline-delimited JSON-RPC in, the same out. */

import { handle } from "./mcp.js";

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      process.stdout.write(
        JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n"
      );
      continue;
    }
    const out = handle(msg);
    if (out) process.stdout.write(JSON.stringify(out) + "\n");
  }
});
process.stdin.on("end", () => process.exit(0));
