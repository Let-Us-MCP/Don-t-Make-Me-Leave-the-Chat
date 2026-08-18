#!/usr/bin/env node
/* Probe an MCP server for MCP Apps support.
 *
 *   node gallery/probe/probe.js http://localhost:8931/mcp
 *
 * This probes servers, which is the half you can automate. The host half of
 * Appendix B's matrix comes from published capability data, because you cannot
 * make somebody else's chat client tell you what it renders.
 */

const endpoint = process.argv[2] || "http://localhost:8931/mcp";

async function rpc(method, params) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

const UI = "io.modelcontextprotocol/ui";

try {
  let caps;
  try {
    caps = (await rpc("server/discover", {})).capabilities;
  } catch {
    caps = (await rpc("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "gallery-probe", version: "1.0.0" },
    })).capabilities;
  }

  const declared = Boolean((caps.extensions || {})[UI]);
  const { tools } = await rpc("tools/list", {});
  const apps = tools.filter((t) => t._meta && t._meta.ui);

  console.log(`endpoint      ${endpoint}`);
  console.log(`${UI}  ${declared ? "declared" : "NOT declared"}`);
  console.log(`tools         ${tools.length} (${apps.length} carry a ui:// resource)`);

  /* `csp` and `permissions` live on the UI resource, not on the tool, so a
   * probe that reads the tool learns nothing about the security posture. The
   * inspector's --app-info makes the same round trip for the same reason. */
  let noText = 0;
  for (const t of apps) {
    const uri = t._meta.ui.resourceUri;
    if (!uri.startsWith("ui://")) console.log(`  ! ${t.name}: resourceUri is not ui://`);
    const res = await rpc("resources/read", { uri }).catch(() => null);
    const meta = res && res.contents && res.contents[0] && res.contents[0]._meta;
    const ui = (meta && meta.ui) || {};
    const csp = ui.csp;
    const reach = csp
      ? [...(csp.connectDomains || []), ...(csp.resourceDomains || [])]
      : null;
    const perms = Object.keys(ui.permissions || {}).filter((k) => ui.permissions[k]);
    console.log(
      `  ${t.name.padEnd(22)} ${uri}\n` +
      `    reaches: ${reach === null ? "<no csp declared>" : reach.length ? reach.join(", ") : "nothing"}` +
      `   permissions: ${perms.length ? perms.join(", ") : "none"}` +
      `   border: ${ui.prefersBorder ? "requested" : "not requested"}`
    );
  }

  /* The question that decides how the server behaves in a host with no app
   * support: is there a usable answer in the text? */
  for (const t of apps) {
    const r = await rpc("tools/call", { name: t.name, arguments: {} }).catch(() => null);
    const text = r && (r.content || []).map((c) => c.text).join(" ").trim();
    if (!text || text.split(/\s+/).length < 9) noText++;
  }
  console.log(
    `\n${apps.length - noText}/${apps.length} apps return a text answer good enough ` +
    `for a host that does not render apps.`
  );
} catch (e) {
  console.error("probe failed:", e.message);
  process.exit(1);
}
