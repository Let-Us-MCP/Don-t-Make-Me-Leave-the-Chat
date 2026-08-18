#!/usr/bin/env node
/* The figure camera.
 *
 * Drives headless Chrome over the DevTools Protocol, plays each scene in the
 * gallery's mini host, and screenshots the result. Every annotated render in
 * the book comes out of this, which is why the book can promise its figures
 * regenerate rather than being hand-cropped screenshots.
 *
 *   node tools/capture_figures.mjs            # every scene with a figure number
 *   node tools/capture_figures.mjs rate-after # one scene
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "docs", "figures");
const PORT = Number(process.env.GALLERY_PORT || 8931);
const CDP_PORT = Number(process.env.CDP_PORT || 9223);

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error("no Chrome found. Set CHROME=/path/to/chrome");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeoutMs = 20000, everyMs = 120) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(everyMs);
  }
}

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }
}

async function main() {
  const scenesSrc = fs.readFileSync(path.join(ROOT, "gallery", "host", "scenes.js"), "utf8");
  const { SCENES } = await import(
    "data:text/javascript;base64," + Buffer.from(scenesSrc).toString("base64")
  );

  const only = process.argv.slice(2);
  const wanted = SCENES.filter(
    (s) => (only.length ? only.includes(s.id) : s.figure)
  );
  if (!wanted.length) {
    console.error("no matching scenes");
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  const gallery = spawn(process.execPath, [path.join(ROOT, "gallery", "serve.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });
  const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "fig-"));
  const chrome = spawn(findChrome(), [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--hide-scrollbars", "--force-device-scale-factor=2",
    "--window-size=1200,1400",
    "about:blank",
  ], { stdio: "ignore" });

  const cleanup = () => {
    try { chrome.kill(); } catch {}
    try { gallery.kill(); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(130); });

  await waitFor(async () => (await fetch(`http://127.0.0.1:${PORT}/`)).ok);
  const version = await waitFor(async () =>
    (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json()
  );

  let built = 0;
  for (const scene of wanted) {
    const target = await (
      await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" })
    ).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    const s = new Session(ws);
    await s.send("Page.enable");
    await s.send("Runtime.enable");
    await s.send("Emulation.setDeviceMetricsOverride", {
      width: 1200, height: 1400, deviceScaleFactor: 2, mobile: false,
    });
    await s.send("Page.navigate", {
      url: `http://127.0.0.1:${PORT}/capture.html?scene=${encodeURIComponent(scene.id)}`,
    });
    await waitFor(() => s.eval("window.__ready === true"), 25000);

    const rect = await s.eval(
      "(() => { const r = document.getElementById('shot').getBoundingClientRect();" +
      " return { x: r.x, y: r.y, width: Math.ceil(r.width), height: Math.ceil(r.height) }; })()"
    );
    const shot = await s.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { ...rect, scale: 1 },
    });
    const file = path.join(OUT, `fig-${scene.figure || scene.id}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`  ${path.relative(ROOT, file)}  ${rect.width}x${rect.height}`);
    built++;
    ws.close();
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`).catch(() => {});
  }

  console.log(`${built} figures captured with ${version.Browser}`);
  cleanup();
  process.exit(0);
}

main().catch((e) => {
  console.error("capture failed:", e.message);
  process.exit(1);
});
