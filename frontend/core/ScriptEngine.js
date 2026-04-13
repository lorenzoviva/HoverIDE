import { emit, on } from "./EventBus.js";

class FrontendScriptEngine {

    constructor() {
        this._scripts    = new Map();  // name → { mod, disposers }
        this._loaded     = false;      // true after first successful loadAll
        this._loading    = null;       // in-flight promise — prevents concurrent loads
    }

    // Load all scripts. If already loaded and force=false, skip the backend fetch.
    async loadAll(force = false) {
        if (this._loading) return this._loading;  // coalesce concurrent calls

        this._loading = this._doLoadAll(force).finally(() => { this._loading = null; });
        return this._loading;
    }

    async _doLoadAll(force) {
        if (this._loaded && !force) return;

        await this.unloadAll();

        let names = [];
        try {
            names = await fetch("/api/scripts/list").then(r => r.json());
        } catch { return; }

        for (const name of names) {
            await this._load(name);
        }
        this._loaded = true;
    }

    async _load(name) {
        try {
            const src = await fetch(`/api/scripts/read/${encodeURIComponent(name)}`).then(r => r.text());
            const mod = this._eval(src, name);
            const disposers = [];
            const ctx = this._makeContext(disposers);

            if (typeof mod?.onInit === "function") {
                await mod.onInit(ctx);
            }

            // Subscribe to all frontend EventBus events
            const off = on("*", async (envelope) => {
                if (typeof mod?.onEvent !== "function") return;
                // envelope shape: { _type, ...rest } — normalize to script API
                const event = {
                    type:      envelope._type,
                    payload:   envelope,
                    timestamp: Date.now(),
                };
                try {
                    await mod.onEvent(event, ctx);
                } catch (e) {
                    console.error(`[ScriptEngine] ${name} onEvent error:`, e);
                }
            });
            disposers.push(off);

            this._scripts.set(name, { mod, disposers });
            console.log(`[ScriptEngine] Loaded: ${name}`);
        } catch (e) {
            console.error(`[ScriptEngine] Failed to load ${name}:`, e);
        }
    }

    // Reload a single script without touching others
    async reload(name) {
        await this.unload(name);
        await this._load(name);
    }

    // Force a full reload (e.g. project changed)
    async reloadAll() {
        this._loaded = false;
        return this.loadAll(true);
    }

    async unload(name) {
        const entry = this._scripts.get(name);
        if (!entry) return;
        if (typeof entry.mod?.onDispose === "function") {
            try { await entry.mod.onDispose(); } catch { /* ignore */ }
        }
        entry.disposers.forEach(d => d());
        this._scripts.delete(name);
    }

    async unloadAll() {
        for (const name of [...this._scripts.keys()]) {
            await this.unload(name);
        }
        this._loaded = false;
    }

    list() {
        return [...this._scripts.keys()];
    }

    // Eval source and extract default export
    // Handles both:  export default { ... }  and  module.exports = { ... }
    _eval(src, name) {
        try {
            const wrapped = `
                "use strict";
                const __exp = {};
                const module = { exports: __exp };
                ${src.replace(/export\s+default\s+/g, "__exp.default = ")}
                return __exp.default !== undefined ? __exp.default : module.exports;
            `;
            return new Function(wrapped)();
        } catch (e) {
            throw new Error(`Syntax error in ${name}: ${e.message}`);
        }
    }

    _makeContext(disposers) {
        return {
            eventBus: {
                emit: (type, payload = {}) => emit(type, payload),
                on:   (type, handler) => {
                    const off = on(type, handler);
                    disposers.push(off);
                    return off;
                },
            },
            fs: {
                readFile:  async (path) => fetch(`/api/file/read?path=${encodeURIComponent(path)}`).then(r => {
                    if (!r.ok) throw new Error(`Cannot read ${path}`);
                    return r.text();
                }),
                listFiles: async () => fetch("/api/file/list").then(r => r.json()),
            },
            systems: {
                list:    async () => fetch("/api/project/current").then(r => r.ok ? r.json().then(p => p.systems || []) : []),
                scan:    async (id) => fetch(`/api/system/${id}/scan`).then(r => r.json()),
                execute: async (id, action, payload = {}) => fetch(`/api/system/${id}/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, payload }),
                }).then(r => r.json()),
            },
            ui: {
                openFile: (path) => emit("file:open", path),
                notify:   (msg)  => emit("ui:notify", { message: msg }),
                refresh:  ()     => emit("explorer:refresh"),
            },
            log: (...args) => console.log("[HoverScript]", ...args),
        };
    }
}

export default new FrontendScriptEngine();