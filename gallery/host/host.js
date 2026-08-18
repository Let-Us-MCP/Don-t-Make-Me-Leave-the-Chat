/* The host side of the postMessage dialect, plus just enough chat around it to
 * look like the medium the book is about.
 *
 * This is a development host and a figure camera. It is not a product. What it
 * does faithfully is the part the book argues about: it puts the app in a
 * narrow guest viewport inside a transcript, sandboxes it, passes tool results
 * in, routes tool calls out, and shows you what the model sees.
 */

const SANDBOX = "allow-scripts allow-forms";

export class MiniHost {
  constructor(opts) {
    this.endpoint = opts.endpoint || "/mcp";
    this.transcript = opts.transcript;
    this.onContext = opts.onContext || (() => {});
    this.theme = opts.theme || { mode: "light" };
    /* A host that can be told to support less. Figure 12-2 is four copies of
     * one widget under four capability sets, and the only way to produce that
     * honestly is to make the host lie on purpose. */
    this.capabilities = opts.capabilities || { toolCalls: {}, context: {}, openLink: {} };
    this.frames = new Map();
    this.nextFrame = 0;
    window.addEventListener("message", (e) => this.route(e));
  }

  async rpc(method, params) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    });
    const body = await res.json();
    if (body.error) throw new Error(body.error.message);
    return body.result;
  }

  /* Render a tool call the way a host does: fetch the declared UI template,
   * put it in a sandboxed frame sized like a chat bubble, then push the result
   * in once it arrives. */
  async render(toolName, args, opts = {}) {
    const tools = (await this.rpc("tools/list")).tools;
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) throw new Error("no such tool: " + toolName);

    const bubble = document.createElement("div");
    bubble.className = "bubble app";
    const label = document.createElement("div");
    label.className = "applabel";
    label.innerHTML =
      '<span class="dotmark"></span><span>' +
      (tool.title || tool.name) +
      "</span><span class='from'>from mcp-apps-gallery</span>";
    bubble.appendChild(label);

    if (!tool._meta || !tool._meta.ui) {
      const result = await this.rpc("tools/call", { name: toolName, arguments: args });
      const text = (result.content || []).map((c) => c.text).join("\n");
      bubble.className = "bubble";
      bubble.textContent = text;
      this.transcript.appendChild(bubble);
      return { bubble, result };
    }

    const uri = tool._meta.ui.resourceUri;
    const resource = await this.rpc("resources/read", { uri });
    const html = resource.contents[0].text;

    const frame = document.createElement("iframe");
    const id = "f" + this.nextFrame++;
    frame.name = id;
    frame.setAttribute("sandbox", SANDBOX);
    frame.setAttribute("srcdoc", html);
    frame.style.height = (opts.height || 220) + "px";
    bubble.appendChild(frame);
    this.transcript.appendChild(bubble);

    const record = { frame, tool, bubble, ready: null };
    this.frames.set(id, record);
    record.ready = new Promise((resolve) => (record.resolveReady = resolve));

    await new Promise((r) => frame.addEventListener("load", r, { once: true }));
    await record.ready;

    /* Arguments stream before results in a real host, so the app gets a chance
     * to draw its skeleton from what is already known. */
    this.post(frame, { jsonrpc: "2.0", method: "ui/tool-input", params: { arguments: args } });

    /* A static preview is this moment and no further: arguments delivered, no
     * result yet. Figure 12-1's third column is captured here on purpose. */
    if (opts.freeze) return { bubble, frame, result: null };

    const result = await this.rpc("tools/call", { name: toolName, arguments: args });
    this.post(frame, { jsonrpc: "2.0", method: "ui/tool-result", params: result });
    return { bubble, frame, result };
  }

  say(who, text) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + who;
    bubble.textContent = text;
    this.transcript.appendChild(bubble);
    return bubble;
  }

  post(frame, message) {
    frame.contentWindow.postMessage(message, "*");
  }

  frameOf(source) {
    for (const [, rec] of this.frames) {
      if (rec.frame.contentWindow === source) return rec;
    }
    return null;
  }

  async route(event) {
    const msg = event.data;
    if (!msg || msg.jsonrpc !== "2.0" || !msg.method) return;
    const rec = this.frameOf(event.source);
    if (!rec) return;
    const reply = (result) =>
      msg.id !== undefined &&
      this.post(rec.frame, { jsonrpc: "2.0", id: msg.id, result });
    const failWith = (message) =>
      msg.id !== undefined &&
      this.post(rec.frame, { jsonrpc: "2.0", id: msg.id, error: { code: -32603, message } });

    switch (msg.method) {
      case "ui/initialize":
        rec.resolveReady && rec.resolveReady();
        reply({
          hostInfo: { name: "gallery-mini-host", version: "1.0.0" },
          capabilities: this.capabilities,
          theme: this.theme,
        });
        break;

      case "ui/size-changed": {
        /* Guests ask, hosts decide. This host grants the request between a
         * floor and a cap, which is roughly what shipping hosts do. The floor
         * matters: a guest that measures itself too early reports zero, and
         * honouring that would collapse a working widget to a sliver. */
        const asked = Number(msg.params && msg.params.height);
        if (!Number.isFinite(asked) || asked <= 0) break;
        rec.frame.style.height = Math.max(48, Math.min(asked + 6, 640)) + "px";
        break;
      }

      case "tools/call":
        if (!this.capabilities.toolCalls) {
          failWith("this host does not allow apps to call tools");
          break;
        }
        try {
          const result = await this.rpc("tools/call", msg.params);
          this.onContext({
            kind: "tool",
            tool: msg.params.name,
            text: (result.content || []).map((c) => c.text).join("\n"),
          });
          reply(result);
        } catch (e) {
          failWith(String(e.message || e));
        }
        break;

      case "ui/set-context":
        this.onContext({
          kind: "context",
          text: (msg.params.content || []).map((c) => c.text).join("\n"),
          structured: msg.params.structuredContent,
        });
        reply({});
        break;

      case "ui/open-link":
        this.onContext({ kind: "link", text: msg.params.url });
        reply({});
        break;

      default:
        failWith("unsupported method: " + msg.method);
    }
  }
}
