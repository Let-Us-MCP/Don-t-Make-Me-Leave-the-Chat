/* A small MCP server, no dependencies.
 *
 * It implements the slice of the protocol the gallery needs: initialize,
 * tools/list, tools/call, resources/list, resources/read, ping. Tools that
 * carry a UI advertise it with `_meta.ui.resourceUri`, which is the whole of
 * the MCP Apps extension as far as a server is concerned.
 *
 * The version handshake accepts whatever the client offers and answers with a
 * version that client can actually speak. A book that wants readers to run its
 * code against the host they already have does not get to be strict here.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { APPS, byName, uiResourceUri } from "./registry.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.join(HERE, "apps");

export const SERVER_INFO = { name: "mcp-apps-gallery", version: "1.0.0" };
export const PREFERRED_VERSION = "2026-07-28";
/* 2026-07-28 makes list results cacheable, so every one carries a time to live
 * and a scope. These lists are static, so an hour and `public` are honest. */
const CACHEABLE = { resultType: "complete", ttlMs: 3600000, cacheScope: "public" };

/* The apps extension is negotiated, not assumed. A client that does not
 * declare `io.modelcontextprotocol/ui` still gets working tools; it just gets
 * the text and never the iframe. Chapter 12 is about designing that fallback
 * rather than suffering it. */
export const UI_EXTENSION = "io.modelcontextprotocol/ui";

const CAPABILITIES = {
  tools: { listChanged: false },
  resources: { listChanged: false, subscribe: false },
  extensions: { [UI_EXTENSION]: { mimeTypes: ["text/html;profile=mcp-app"] } },
};

const KNOWN_VERSIONS = [
  "2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05",
];

/* Apps are authored as small HTML files that share a stylesheet and a bridge.
 * The resource a host fetches is one self-contained document, so the includes
 * are resolved here, at serve time. */
const INCLUDE = /\/\*@include ([\w.-]+)\*\//g;

export function renderApp(relPath) {
  const html = fs.readFileSync(path.join(APPS_DIR, relPath), "utf8");
  return html.replace(INCLUDE, (_, name) =>
    fs.readFileSync(path.join(APPS_DIR, name), "utf8")
  );
}

function toolDescriptor(app) {
  const tool = {
    name: app.name,
    title: app.title,
    description: app.description,
    inputSchema: app.inputSchema,
  };
  if (app.ui) {
    tool._meta = {
      ui: {
        resourceUri: uiResourceUri(app),
        /* Declaring no external origins is a promise the user can feel: this
         * app cannot phone anywhere. Chapter 10 argues that this is a design
         * decision rather than a security checkbox. */
        /* Field shape per the ext-apps specification. Empty lists mean this
         * app may not reach any external origin, which is a promise the host
         * enforces and the user can be told about. */
        csp: { connectDomains: [], resourceDomains: [] },
        preferredFrameSize: ["380px", "auto"],
      },
    };
  }
  return tool;
}

export function listTools() {
  return APPS.map(toolDescriptor);
}

export function listResources() {
  return APPS.filter((a) => a.ui).map((a) => ({
    uri: uiResourceUri(a),
    name: a.title,
    description: `User interface for ${a.name}.`,
    mimeType: "text/html;profile=mcp-app",
  }));
}

export function readResource(uri) {
  const app = APPS.find((a) => uiResourceUri(a) === uri);
  if (!app) {
    const err = new Error(`Resource not found: ${uri}`);
    err.code = -32002;
    throw err;
  }
  return {
    contents: [
      { uri, mimeType: "text/html;profile=mcp-app", text: renderApp(app.ui) },
    ],
  };
}

export function callTool(name, args) {
  const app = byName(name);
  if (!app) {
    const err = new Error(`Unknown tool: ${name}`);
    err.code = -32602;
    throw err;
  }
  try {
    const result = app.run(args || {});
    /* Under 2026-07-28 every result declares whether it is finished. This one
     * always is: none of the gallery's tools needs a mid-flight answer from the
     * user, which is what `input_required` is for. */
    result.resultType = "complete";
    if (app.ui) {
      result._meta = { ...(result._meta || {}), ui: { resourceUri: uiResourceUri(app) } };
    }
    return result;
  } catch (e) {
    /* Tool failures are results, not protocol errors: the model is supposed to
     * read them and try something else. */
    return {
      resultType: "complete",
      isError: true,
      content: [{ type: "text", text: String(e.message || e) }],
    };
  }
}

export function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  try {
    switch (method) {
      case "initialize": {
        const asked = params && params.protocolVersion;
        const version = KNOWN_VERSIONS.includes(asked) ? asked : PREFERRED_VERSION;
        return reply({
          protocolVersion: version,
          capabilities: CAPABILITIES,
          serverInfo: SERVER_INFO,
          instructions:
            "A gallery of MCP Apps built for the book Don't Make Me Leave the Chat. " +
            "Tools ending in _suite, or named new_expense, ops_overview, open_document, " +
            "search_flights, deploy_tracker, and budget_canvas are the deliberately " +
            "over-built 'before' versions used in the book's teardowns.",
        });
      }
      /* 2026-07-28 replaces the initialize handshake with a cacheable
       * discovery call. Both are answered here, because the hosts a reader
       * has installed today are spread across both eras. */
      case "server/discover":
        return reply({
          ...CACHEABLE,
          supportedVersions: KNOWN_VERSIONS,
          capabilities: CAPABILITIES,
          _meta: { "io.modelcontextprotocol/serverInfo": SERVER_INFO },
        });

      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return reply({});
      /* 2026-07-28 requires `resultType` on list results, and a client that
       * negotiated that revision refuses a response without it. Sending it
       * unconditionally is harmless to older clients, which ignore unknown
       * fields, and it is the whole fix for "tools fetch failed". */
      case "tools/list":
        return reply({ ...CACHEABLE, tools: listTools() });
      case "tools/call":
        return reply(callTool(params.name, params.arguments));
      case "resources/list":
        return reply({ ...CACHEABLE, resources: listResources() });
      case "resources/read":
        return reply(readResource(params.uri));
      case "prompts/list":
        return reply({ ...CACHEABLE, prompts: [] });
      default:
        return id === undefined ? null : fail(-32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return fail(e.code || -32603, String(e.message || e));
  }
}
