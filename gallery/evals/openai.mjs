#!/usr/bin/env node
/* The same invocation eval, run against OpenAI instead of Claude Code.
 *
 * Chapter 12 argues that hosts and models differ. This is what makes that
 * claim evidential instead of asserted: the same thirty prompts, the same tool
 * descriptions, a different model family. A description that only works for one
 * of them is tuned rather than clear.
 *
 * It is also a better measurement than model.mjs. Claude Code's JSON output
 * does not enumerate tool calls, so that runner has to ask the model to report
 * what it called. Here the tool choice comes straight out of the API response,
 * so nothing is self-reported.
 *
 * No tunnel is involved. The gallery's tool list is read locally over stdio and
 * converted to function definitions, so the model never talks to the server.
 *
 *   node gallery/evals/openai.mjs --list-models     # what this key can use
 *   node gallery/evals/openai.mjs                   # every suite
 *   node gallery/evals/openai.mjs compare_rates
 *   OPENAI_MODEL=... node gallery/evals/openai.mjs
 *
 * Reads the key from OPENAI_API_KEY, or from a file named by OPENAI_CONF as
 * either a bare key or KEY=value lines. The key is never printed.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));

// --- credentials ----------------------------------------------------------

function readKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const conf = process.env.OPENAI_CONF;
  if (!conf) return null;
  const body = fs.readFileSync(conf, "utf8");
  const line = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /sk-/.test(l));
  if (!line) return null;
  const m = /(sk-[A-Za-z0-9_\-]+)/.exec(line);
  return m ? m[1] : null;
}

const KEY = readKey();
if (!KEY) {
  console.error(
    "No key. Set OPENAI_API_KEY, or OPENAI_CONF=/path/to/conf and this will\n" +
    "read the first sk- value out of it. The key is never printed or logged."
  );
  process.exit(2);
}

async function api(endpoint, body) {
  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${KEY}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) {
    /* Errors can echo the request; print only what the API said went wrong. */
    throw new Error(`${res.status} ${json?.error?.message || "request failed"}`);
  }
  return json;
}

// --- the gallery's tools, read locally ------------------------------------

function galleryTools() {
  return new Promise((resolve, reject) => {
    const p = spawn("node", [path.join(ROOT, "gallery", "stdio.js")]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => {
      const line = out.split("\n").filter(Boolean).map(JSON.parse)
        .find((m) => m.id === 2);
      line ? resolve(line.result.tools) : reject(new Error("no tools/list"));
    });
    p.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize",
                       params: { protocolVersion: "2026-07-28", capabilities: {} } }) + "\n" +
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n"
    );
    p.stdin.end();
  });
}

/* An MCP tool and an OpenAI function differ in wrapping, not in substance,
 * which is the point Chapter 2 keeps making: the model's whole interface is a
 * name, a description, and a schema, whoever is serving it. */
function asFunctions(tools) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema && Object.keys(t.inputSchema).length
        ? t.inputSchema
        : { type: "object", properties: {} },
    },
  }));
}

// --- model selection ------------------------------------------------------

/* "Cheapest available" is decided from the account's own model list rather
 * than from a price table baked in here, which would be wrong within a month.
 * The ordering below is a preference, not a claim about current pricing:
 * smaller and older tiers first, and whatever matches is what gets used. */
const CHEAP_FIRST = [
  /^gpt-5-nano/, /^gpt-4\.1-nano/, /^gpt-5-mini/, /^gpt-4o-mini/,
  /^gpt-4\.1-mini/, /^o4-mini/, /^gpt-5(?!-)/, /^gpt-4o/, /^gpt-4\.1/,
];

async function pickModel() {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  const { data } = await api("models");
  const names = data.map((m) => m.id);
  for (const rx of CHEAP_FIRST) {
    const hit = names.filter((n) => rx.test(n)).sort()[0];
    if (hit) return hit;
  }
  throw new Error(`no known chat model on this key. Available: ${names.slice(0, 20).join(", ")}`);
}

// --- run ------------------------------------------------------------------

const argv = process.argv.slice(2);

if (argv.includes("--list-models")) {
  const { data } = await api("models");
  const names = data.map((m) => m.id).sort();
  console.log(names.join("\n"));
  console.log(`\n${names.length} models. Cheapest match: ${await pickModel()}`);
  process.exit(0);
}

const only = argv.filter((a) => !a.startsWith("--"));
const suites = JSON.parse(fs.readFileSync(path.join(HERE, "prompts.json"), "utf8"))
  .suites.filter((s) => (only.length ? only.includes(s.tool) : true));

const model = await pickModel();
const functions = asFunctions(await galleryTools());
console.log(`model ${model}, ${functions.length} tools\n`);

const results = [];

for (const suite of suites) {
  const groups = [["invoke", suite.invoke], ["skip", suite.skip]];
  if (suite.prefer_sibling) groups.push(["sibling", suite.prefer_sibling.prompts]);

  for (const [kind, prompts] of groups) {
    for (const prompt of prompts) {
      const body = {
        model,
        messages: [
          { role: "system", content:
              "You are a helpful assistant with tools. Use a tool only when it " +
              "is the right way to answer." },
          { role: "user", content: `${suite.context}\n\n${prompt}` },
        ],
        tools: functions,
        tool_choice: "auto",
      };
      let called = [];
      try {
        const out = await api("chat/completions", body);
        called = (out.choices[0].message.tool_calls || []).map((c) => c.function.name);
      } catch (e) {
        console.error(`  error on ${JSON.stringify(prompt).slice(0, 40)}: ${e.message}`);
        continue;
      }
      const hit = called.includes(suite.tool);
      const ok =
        kind === "invoke" ? hit
        : kind === "skip" ? !hit
        : called.includes(suite.prefer_sibling.tool);
      results.push({ suite: suite.tool, kind, prompt, called, ok });
      console.log(
        `${ok ? "ok  " : "FAIL"} [${kind}] ${suite.tool.padEnd(16)} ` +
        `${JSON.stringify(prompt).slice(0, 50).padEnd(52)} -> ${called.join(",") || "none"}`
      );
    }
  }
}

const by = (k) => results.filter((r) => r.kind === k);
const score = (k) => (by(k).length ? `${by(k).filter((r) => r.ok).length}/${by(k).length}` : "n/a");
const summary = {
  model,
  suites: suites.map((s) => s.tool),
  invoked: score("invoke"),
  skipped: score("skip"),
  sibling: score("sibling"),
};
fs.writeFileSync(
  path.join(HERE, "results-openai.json"),
  JSON.stringify({ summary, results }, null, 2)
);
console.log("\n" + JSON.stringify(summary, null, 2));
