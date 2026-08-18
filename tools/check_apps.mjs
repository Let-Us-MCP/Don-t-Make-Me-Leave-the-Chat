#!/usr/bin/env node
/* Every app the server can serve must parse. A syntax error inside a sandboxed
 * iframe is invisible from the host: the app simply never calls ui/initialize,
 * and the widget sits there being blank. Ask this question at build time.
 */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APPS } from "../gallery/registry.js";
import { renderApp } from "../gallery/mcp.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let bad = 0, checked = 0;

for (const app of APPS.filter((a) => a.ui)) {
  const html = renderApp(app.ui);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!scripts.length) {
    console.log(`  ${app.ui}: no script`);
    continue;
  }
  for (const [i, src] of scripts.entries()) {
    checked++;
    try {
      new vm.Script(src, { filename: `${app.ui}#script${i}` });
    } catch (e) {
      bad++;
      console.error(`${app.ui} script ${i}: ${e.message}`);
    }
  }
  if (html.includes("@include")) {
    bad++;
    console.error(`${app.ui}: unresolved include`);
  }
  if (!/app\.connect\(\)/.test(html)) {
    bad++;
    console.error(`${app.ui}: never calls app.connect(), so the host will wait forever`);
  }
}

console.log(`${checked} scripts across ${APPS.filter((a) => a.ui).length} apps, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
