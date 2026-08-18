/* Model-as-user checks that need no model.
 *
 * Chapter 11 splits testing in two. Five humans, watched for an afternoon,
 * find the problems people have. These find the problems the *model* has, and
 * they run in about eighty milliseconds, so they run on every commit.
 *
 * Each check answers a question a model would ask about your tool, and fails
 * when the answer is missing. None of them is clever. All of them have caught
 * something.
 */

import { APPS, uiResourceUri } from "../registry.js";
import { renderApp } from "../mcp.js";

const findings = [];

function fail(tool, rule, message) {
  findings.push({ level: "error", tool, rule, message });
}
function warn(tool, rule, message) {
  findings.push({ level: "warn", tool, rule, message });
}

/* The before-apps are deliberately bad. They are the book's exhibits, so they
 * are exempt from the rules they exist to violate. */
const isExhibit = (app) => app.variant === "before";

const TRIGGER = /\b(use when|use this when|when the user|call this when|when somebody)\b/i;
const VERB_FIRST = /^(open|launch|display|show the .* (suite|dashboard|panel)|view)\b/i;

for (const app of APPS) {
  const t = app.name;

  // 1. Can the model tell what this is for?
  if (!isExhibit(app) && (!app.description || app.description.length < 40)) {
    fail(t, "description-length", "description is too short to disambiguate from anything");
  }
  if (!isExhibit(app) && !app.hidden && !TRIGGER.test(app.description || "")) {
    fail(t, "no-trigger", "description never says when to reach for this tool");
  }
  if (!isExhibit(app) && VERB_FIRST.test(app.description || "")) {
    warn(t, "opens-something", 'description leads with "open"; opening is not a user goal');
  }

  // 2. Does the tool have an address space, or exactly one address?
  const props = Object.keys((app.inputSchema || {}).properties || {});
  if (!isExhibit(app) && !app.hidden && props.length === 0) {
    fail(t, "empty-schema",
      "no input properties, so the model cannot re-summon a specific view and " +
      "the app must ask the user for everything");
  }
  for (const [name, schema] of Object.entries((app.inputSchema || {}).properties || {})) {
    if (!isExhibit(app) && !schema.description && !schema.enum && !("default" in schema)) {
      warn(t, "bare-property", `property "${name}" has no description, enum, or default`);
    }
  }

  // 3. Is the text answer an answer, or a log line?
  let result;
  try {
    result = app.run(sampleArgs(app));
  } catch (e) {
    fail(t, "run-throws", `run() threw on sample arguments: ${e.message}`);
    continue;
  }
  const text = (result.content || []).map((c) => c.text).join(" ");
  if (!text.trim()) {
    fail(t, "no-content", "returns no text, so a host without the UI extension gets nothing");
  } else if (!isExhibit(app) && text.trim().split(/\s+/).length < 9) {
    fail(t, "log-line", `content reads as a log line rather than an answer: "${text.trim()}"`);
  }

  // 4. Does the app tell the model what the human did?
  if (app.ui) {
    const html = renderApp(app.ui);
    const writesBack = /setContext\(/.test(html);
    const interactive = /addEventListener\(\s*["'](click|input|change|pointerdown)/.test(html);
    if (!isExhibit(app) && interactive && !writesBack) {
      fail(t, "no-writeback",
        "the app has interactive controls and never calls setContext, so the " +
        "model cannot see what the human did");
    }
    if (!/reportSize|size-changed/.test(html)) {
      warn(t, "no-size", "app never reports its height, so the host has to guess");
    }
    if (!/resourceUri/.test(JSON.stringify({ uri: uiResourceUri(app) }))) {
      // structural placeholder; uiResourceUri is asserted below
    }
    if (!uiResourceUri(app).startsWith("ui://")) {
      fail(t, "bad-uri", "UI resource does not use the ui:// scheme");
    }
  }

  // 5. Does anything that changes the world say how to change it back?
  const mutating = /^(submit|apply|delete|remove|send|hold|create|cancel|void)_/.test(t);
  const reversible =
    /undoTool|void|cancel|release|reverse/i.test(JSON.stringify(result.structuredContent || {})) ||
    APPS.some((a) => a !== app && /^(void|cancel|undo|release)_/.test(a.name));
  if (mutating && !reversible) {
    warn(t, "no-undo", "changes something and names no way to reverse it");
  }
}

function sampleArgs(app) {
  const out = {};
  for (const [name, schema] of Object.entries((app.inputSchema || {}).properties || {})) {
    if ("default" in schema) out[name] = schema.default;
    else if (schema.enum) out[name] = schema.enum[0];
    else if (schema.type === "number" || schema.type === "integer") out[name] = schema.minimum ?? 1;
    else if (schema.type === "array") out[name] = [{ name: "x", amount: 1 }];
    else if (schema.format === "date") out[name] = "2026-08-20";
    else out[name] = "sample";
  }
  return out;
}

export { findings };
