#!/usr/bin/env node
/* The model-in-the-loop half of Chapter 11, run for real.
 *
 * Drives a host you already have (Claude Code) against the gallery over MCP,
 * one prompt at a time, and records whether the right tool was called. The
 * static checks in checks.js tell you a description has no trigger clause.
 * This tells you whether the trigger clause works.
 *
 *   node gallery/evals/model.mjs                 # every suite
 *   node gallery/evals/model.mjs compare_rates   # one
 *   node gallery/evals/model.mjs --runs 3        # three passes, for rates
 *
 * Writes gallery/evals/results.json. Costs real money; not for CI.
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));

const argv = process.argv.slice(2);
const runs = Number((argv.find((a) => a.startsWith("--runs")) || "").split("=")[1]
  || (argv.includes("--runs") ? argv[argv.indexOf("--runs") + 1] : 1)) || 1;
const only = argv.filter((a) => !a.startsWith("--") && !/^\d+$/.test(a));

const suites = JSON.parse(
  fs.readFileSync(path.join(HERE, "prompts.json"), "utf8")
).suites.filter((s) => (only.length ? only.includes(s.tool) : true));

/* Run from a scratch directory that contains nothing but an .mcp.json.
 *
 * The first version of this harness ran in the repository root, and the model
 * under test read gallery/evals/prompts.json, worked out it was being scored,
 * and said so in its answer. It was right: an eval the subject can read is
 * measuring file access rather than trigger phrasing. So the subject gets the
 * server and nothing else.
 */
const SANDBOX = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "mcp-eval-"));
fs.writeFileSync(
  path.join(SANDBOX, ".mcp.json"),
  JSON.stringify({
    mcpServers: {
      gallery: { command: "node", args: [path.join(ROOT, "gallery", "stdio.js")] },
    },
  })
);
process.on("exit", () => fs.rmSync(SANDBOX, { recursive: true, force: true }));

async function ask(prompt) {
  const { stdout } = await run(
    "claude",
    ["-p", prompt, "--output-format", "json",
     "--mcp-config", path.join(SANDBOX, ".mcp.json"), "--strict-mcp-config",
     "--allowedTools", "mcp__gallery", "--permission-mode", "bypassPermissions"],
    { cwd: SANDBOX, maxBuffer: 32 * 1024 * 1024, timeout: 240000 }
  );
  const body = JSON.parse(stdout);
  return {
    text: body.result || "",
    cost: body.total_cost_usd || 0,
    turns: body.num_turns || 0,
  };
}

/* Claude Code's JSON output does not enumerate tool calls, so invocation is
 * detected the way a reviewer would: ask the model to say what it used. This
 * is weaker than reading a trace and it is what a host you did not build gives
 * you, which is the honest constraint most readers will also be under. */
function probe(prompt) {
  return (
    prompt +
    "\n\nAnswer normally. Then on a final line, write TOOLS= followed by a " +
    "comma-separated list of the MCP tool names you called, or TOOLS=none."
  );
}

function toolsFrom(text) {
  const m = /TOOLS=([^\n]*)/i.exec(text);
  if (!m) return null;
  const raw = m[1].trim();
  if (/^none/i.test(raw)) return [];
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^mcp__gallery__/, "").replace(/[`.]/g, ""))
    .filter(Boolean);
}

const results = [];
let spend = 0;

for (const suite of suites) {
  for (let pass = 1; pass <= runs; pass++) {
    for (const [kind, prompts] of [["invoke", suite.invoke], ["skip", suite.skip]]) {
      for (const p of prompts) {
        const full = `${suite.context}\n\n${p}`;
        const out = await ask(probe(full));
        spend += out.cost;
        const called = toolsFrom(out.text);
        const hit = called ? called.includes(suite.tool) : null;
        const ok = kind === "invoke" ? hit === true : hit === false;
        results.push({ suite: suite.tool, pass, kind, prompt: p, called, ok });
        console.log(
          `${ok ? "ok  " : "FAIL"} [${kind}] ${suite.tool.padEnd(16)} ` +
          `${JSON.stringify(p).slice(0, 52).padEnd(54)} -> ` +
          (called === null ? "(no TOOLS line)" : called.join(",") || "none")
        );
      }
    }

    for (const q of suite.readback) {
      const full = `${suite.context}\n\n${suite.invoke[0]}\n\nThen answer: ${q}`;
      const out = await ask(full);
      spend += out.cost;
      results.push({ suite: suite.tool, pass, kind: "readback", prompt: q,
                     answer: out.text.slice(0, 400) });
      console.log(`--   [readback] ${suite.tool.padEnd(16)} ${q}`);
      console.log(`     ${out.text.replace(/\s+/g, " ").slice(0, 150)}`);
    }
  }
}

const invoke = results.filter((r) => r.kind === "invoke");
const skip = results.filter((r) => r.kind === "skip");
const summary = {
  suites: suites.map((s) => s.tool),
  runs,
  invoked: `${invoke.filter((r) => r.ok).length}/${invoke.length}`,
  skipped: `${skip.filter((r) => r.ok).length}/${skip.length}`,
  costUsd: Math.round(spend * 100) / 100,
};
fs.writeFileSync(
  path.join(HERE, "results.json"),
  JSON.stringify({ summary, results }, null, 2)
);
console.log("\n" + JSON.stringify(summary, null, 2));
