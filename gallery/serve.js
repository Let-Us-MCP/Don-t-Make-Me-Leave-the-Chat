#!/usr/bin/env node
/* One process: the MCP endpoint at /mcp, and the mini host at /.
 *
 * Streamable HTTP with JSON responses, which is the simplest thing that both
 * the mini host and a real client will talk to. No dependencies.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { handle } from "./mcp.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8931);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, body) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/mcp") {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, mcp-protocol-version",
        "access-control-allow-methods": "POST, OPTIONS",
      });
      res.end();
      return;
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let out;
      try {
        out = handle(JSON.parse(body));
      } catch (e) {
        out = { jsonrpc: "2.0", id: null, error: { code: -32700, message: String(e.message) } };
      }
      res.writeHead(out ? 200 : 202, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(out ? JSON.stringify(out) : "");
    });
    return;
  }

  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(HERE, "host", path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  process.stdout.write(`gallery on http://localhost:${PORT}  (MCP at /mcp)\n`);
});
