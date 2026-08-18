#!/usr/bin/env node
/* Run the model-as-user checks. Exit non-zero on any error-level finding.
 *
 *   node gallery/evals/run.js            errors only
 *   node gallery/evals/run.js --all      warnings too
 */

import { findings } from "./checks.js";
import { APPS } from "../registry.js";

const showAll = process.argv.includes("--all");
const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");

for (const f of showAll ? findings : errors) {
  const tag = f.level === "error" ? "FAIL" : "warn";
  console.log(`${tag}  ${f.tool.padEnd(22)} [${f.rule}] ${f.message}`);
}

console.log(
  `\n${APPS.length} tools checked, ${errors.length} error(s), ${warns.length} warning(s)` +
  (showAll ? "" : " (use --all to list warnings)")
);
process.exit(errors.length ? 1 : 0);
