import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";

// Output routing for each script:
//   "ide"     → shows in ScriptConsole panel
//   "devtools" → console.log to browser devtools only
const ROUTE_LABELS = { ide: "IDE console", devtools: "Devtools" };

export default class ScriptConsole extends Component {

    constructor(root) {
        super(root);
        // Map: scriptName → { entries: [], route: "ide"|"devtools" }
        this._scripts   = new Map();
        this._active    = null;  // currently shown tab
        this._visible   = false;
    }

    mount() {
        this.root.className = "script-console";
        this.root.style.display = "none";

        // Tab bar
        this._tabBar = this.create("div", "sc-tab-bar");
        // Toolbar (right side of tab bar)
        this._toolbar = this.create("div", "sc-toolbar");
        const clearBtn = this.create("button", "sc-ctrl-btn");
        clearBtn.textContent = "Clear";
        clearBtn.onclick = () => this._clearActive();
        this._toolbar.appendChild(clearBtn);
        this._tabBar.appendChild(this._toolbar);
        this.root.appendChild(this._tabBar);

        // Output area
        this._output = this.create("div", "script-console-output");
        this.root.appendChild(this._output);

        // Event listeners
        on("script:log",     (e) => this._receive("log",   e.scriptName, e.args));
        on("script:error",   (e) => this._receive("error", e.scriptName, e.args));
        on("script:warn",    (e) => this._receive("warn",  e.scriptName, e.args));
        on("script:run",     (e) => this._receive("run",   e.scriptName, [`▶ Running ${e.scriptName}`]));
        on("script:loaded",  (e) => this._receive("info",  e.scriptName, [`✓ Loaded`]));
        on("script:unloaded",(e) => this._handleUnload(e.scriptName));

        on("script:console:toggle", () => this.toggle());
        on("script:console:show",   () => this.show());
    }

    show()   { this._visible = true;  this.root.style.display = "flex"; }
    hide()   { this._visible = false; this.root.style.display = "none"; }
    toggle() { this._visible ? this.hide() : this.show(); }

    // ── Internal ─────────────────────────────────────────

    _ensureScript(name) {
        if (!this._scripts.has(name)) {
            this._scripts.set(name, { entries: [], route: "ide" });
            this._addTab(name);
        }
        if (!this._active) this._activateTab(name);
    }

    _receive(level, scriptName, args) {
        const name = scriptName || "global";
        this._ensureScript(name);
        const entry = { level, args, ts: new Date().toLocaleTimeString("en", { hour12: false }) };
        this._scripts.get(name).entries.push(entry);

        const route = this._scripts.get(name).route;

        if (route === "devtools") {
            const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
            fn(`[HoverScript:${name}]`, ...args);
            return;
        }

        // Route to IDE console
        this.show();
        if (this._active === name) this._appendEntry(entry);
    }

    _appendEntry({ level, args, ts }) {
        const line = this.create("div", `sc-line sc-line--${level}`);
        const meta = this.create("span", "sc-meta");
        meta.textContent = ts;
        const msg = this.create("span", "sc-msg");
        msg.textContent = args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ");
        line.appendChild(meta);
        line.appendChild(msg);
        this._output.appendChild(line);
        this._output.scrollTop = this._output.scrollHeight;
    }

    _addTab(name) {
        const tab = this.create("div", "sc-tab");
        tab.dataset.script = name;

        const dot = this.create("span", "sc-tab-dot");
        const label = this.create("span", "sc-tab-label");
        label.textContent = name;

        // Route toggle button
        const routeBtn = this.create("button", "sc-route-btn");
        routeBtn.title = "Toggle output: IDE console / Devtools";
        routeBtn.textContent = "⇄";
        routeBtn.onclick = (e) => {
            e.stopPropagation();
            this._toggleRoute(name);
        };

        tab.appendChild(dot);
        tab.appendChild(label);
        tab.appendChild(routeBtn);
        tab.onclick = () => this._activateTab(name);

        // Insert before toolbar
        this._tabBar.insertBefore(tab, this._toolbar);
        this._updateTabDot(name);
    }

    _activateTab(name) {
        this._active = name;
        this._tabBar.querySelectorAll(".sc-tab").forEach(t => {
            t.classList.toggle("sc-tab--active", t.dataset.script === name);
        });
        this._output.innerHTML = "";
        const script = this._scripts.get(name);
        if (script) script.entries.forEach(e => this._appendEntry(e));
    }

    _toggleRoute(name) {
        const script = this._scripts.get(name);
        if (!script) return;
        script.route = script.route === "ide" ? "devtools" : "ide";
        this._updateTabDot(name);
        // Show brief notification
        const msg = script.route === "ide"
            ? "Output attached to IDE console"
            : "Output detached — check browser devtools";
        this._receive("info", name, [msg]);
    }

    _updateTabDot(name) {
        const tab    = this._tabBar.querySelector(`[data-script="${name}"]`);
        const script = this._scripts.get(name);
        if (!tab || !script) return;
        const dot = tab.querySelector(".sc-tab-dot");
        dot.style.background = script.route === "ide" ? "#73c991" : "#888";
        dot.title = `Output: ${ROUTE_LABELS[script.route]}`;
    }

    _clearActive() {
        if (!this._active) return;
        const script = this._scripts.get(this._active);
        if (script) script.entries = [];
        this._output.innerHTML = "";
    }

    _handleUnload(name) {
        this._receive("info", name, ["✕ Unloaded"]);
        const tab = this._tabBar.querySelector(`[data-script="${name}"]`);
        if (tab) {
            const dot = tab.querySelector(".sc-tab-dot");
            dot.style.background = "#444";
        }
    }
}