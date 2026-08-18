/* The app side of the MCP Apps postMessage dialect, in about 120 lines.
 *
 * The real SDK (@modelcontextprotocol/ext-apps) does more. This does exactly
 * what the book's figures and the gallery's evals need, with no dependencies,
 * so every app in this repository is readable end to end in one sitting.
 *
 * Wire shape: JSON-RPC 2.0 over window.postMessage to the host frame.
 *   app  -> host : ui/initialize, tools/call, ui/set-context, ui/size-changed,
 *                  ui/open-link
 *   host -> app  : ui/tool-input (streaming arguments), ui/tool-result,
 *                  ui/theme-changed
 */
(function (global) {
  "use strict";

  function App(info) {
    this.info = info || { name: "app", version: "0.0.0" };
    this._id = 0;
    this._pending = new Map();
    this.host = null;
    this.ontoolinput = null;
    this.ontoolresult = null;
    this.onthemechanged = null;
    this._onMessage = this._onMessage.bind(this);
  }

  App.prototype.connect = function () {
    global.addEventListener("message", this._onMessage);
    return this._request("ui/initialize", {
      appInfo: this.info,
      capabilities: { toolCalls: {}, context: {} },
    }).then(
      function (result) {
        this.host = result || {};
        if (this.host.theme) this.applyTheme(this.host.theme);
        this.reportSize();
        return this.host;
      }.bind(this)
    );
  };

  App.prototype.applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme.mode || "light");
    var vars = theme.cssVariables || {};
    for (var key in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, key)) {
        document.documentElement.style.setProperty(key, vars[key]);
      }
    }
  };

  /* Tell the host how tall we are. Guests do not get to pick their own
   * viewport, but they are expected to say how much of it they need. */
  App.prototype.reportSize = function () {
    /* Measured after a frame, because an iframe appended and measured in the
     * same tick can report zero, and a host that believes a zero collapses
     * your widget to a sliver. Both sides guard against it; this is the side
     * that knows the real answer. */
    var self = this;
    requestAnimationFrame(function () {
      var h = Math.max(
        document.documentElement ? document.documentElement.scrollHeight : 0,
        document.body ? document.body.scrollHeight : 0,
        document.body ? Math.ceil(document.body.getBoundingClientRect().height) : 0
      );
      if (h > 0) self._notify("ui/size-changed", { height: Math.ceil(h) });
    });
  };

  App.prototype.callServerTool = function (params) {
    return this._request("tools/call", params);
  };

  /* Write state back where the model can read it. This is Law 2 in one call:
   * whatever the human just did in the widget becomes something the model
   * knows without being told. */
  App.prototype.setContext = function (text, structured) {
    return this._request("ui/set-context", {
      content: [{ type: "text", text: text }],
      structuredContent: structured,
    });
  };

  App.prototype.openLink = function (url) {
    return this._request("ui/open-link", { url: url });
  };

  App.prototype._request = function (method, params) {
    var id = ++this._id;
    var self = this;
    return new Promise(function (resolve, reject) {
      self._pending.set(id, { resolve: resolve, reject: reject });
      self._post({ jsonrpc: "2.0", id: id, method: method, params: params });
    });
  };

  App.prototype._notify = function (method, params) {
    this._post({ jsonrpc: "2.0", method: method, params: params });
  };

  App.prototype._post = function (message) {
    global.parent.postMessage(message, "*");
  };

  App.prototype._onMessage = function (event) {
    var msg = event.data;
    if (!msg || msg.jsonrpc !== "2.0") return;

    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      var pending = this._pending.get(msg.id);
      if (!pending) return;
      this._pending.delete(msg.id);
      if (msg.error) pending.reject(new Error(msg.error.message || "host error"));
      else pending.resolve(msg.result);
      return;
    }

    switch (msg.method) {
      case "ui/tool-input":
        if (this.ontoolinput) this.ontoolinput(msg.params || {});
        break;
      case "ui/tool-result":
        if (this.ontoolresult) this.ontoolresult(msg.params || {});
        this.reportSize();
        break;
      /* Gallery-only. The figure camera cannot read into a sandboxed frame, and
       * it should not be able to, so it asks the app where an element is and
       * draws its callout in the parent. Real hosts never send this. */
      case "ui/measure": {
        var el = document.querySelector((msg.params || {}).selector || "");
        var r = el ? el.getBoundingClientRect() : null;
        this._post({
          jsonrpc: "2.0", id: msg.id,
          result: r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null,
        });
        return;
      }

      /* Gallery-only, same reasoning as ui/measure: the camera cannot reach
       * into the frame, so it asks the app to press its own button. */
      case "ui/_click": {
        var target = document.querySelector((msg.params || {}).selector || "");
        if (target) target.click();
        break;
      }

      case "ui/theme-changed":
        this.applyTheme((msg.params || {}).theme || {});
        if (this.onthemechanged) this.onthemechanged(msg.params);
        break;
    }

    if (msg.id !== undefined) {
      this._post({ jsonrpc: "2.0", id: msg.id, result: {} });
    }
  };

  global.App = App;
})(window);
