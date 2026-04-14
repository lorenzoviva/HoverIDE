import { emit, on } from "./EventBus.js";

class FrontendScriptEngine {

    constructor() {
        this._scripts = new Map();
        this._loaded  = false;
        this._loading = null;
    }

    async loadAll(force = false) {
        if (this._loading) return this._loading;
        this._loading = this._doLoadAll(force).finally(() => { this._loading = null; });
        return this._loading;
    }

    async _doLoadAll(force) {
        if (this._loaded && !force) return;
        await this.unloadAll();
        let names = [];
        try { names = await fetch("/api/scripts/list").then(r => r.json()); }
        catch { return; }
        for (const name of names) await this._load(name);
        this._loaded = true;
    }

    async _load(name) {
        try {
            const src = await fetch(`/api/scripts/read/${encodeURIComponent(name)}`).then(r => r.text());
            const mod = this._eval(src, name);
            const disposers = [];
            const ctx = this._makeContext(name, disposers);

            if (typeof mod?.onInit === "function") await mod.onInit(ctx);

            emit("script:loaded", { scriptName: name });

            const off = on("*", async (envelope) => {
                if (typeof mod?.onEvent !== "function") return;
                try {
                    await mod.onEvent({ type: envelope._type, payload: envelope, timestamp: Date.now() }, ctx);
                } catch (e) {
                    emit("script:error", { scriptName: name, args: [e.message] });
                }
            });
            disposers.push(off);

            this._scripts.set(name, { mod, disposers });
        } catch (e) {
            emit("script:error", { scriptName: name, args: [`Load failed: ${e.message}`] });
        }
    }

    async reload(name) {
        await this.unload(name);
        emit("script:run", { scriptName: name });
        await this._load(name);
    }

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
        emit("script:unloaded", { scriptName: name });
    }

    async unloadAll() {
        for (const name of [...this._scripts.keys()]) await this.unload(name);
        this._loaded = false;
    }

    list() { return [...this._scripts.keys()]; }

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

    _makeContext(scriptName, disposers) {
        const log = (...args) => emit("script:log",  { scriptName, args });
        const err = (...args) => emit("script:error", { scriptName, args });
        const wrn = (...args) => emit("script:warn",  { scriptName, args });

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
                readFile:  async (p) => fetch(`/api/file/read?path=${encodeURIComponent(p)}`).then(r => {
                    if (!r.ok) throw new Error(`Cannot read ${p}`);
                    return r.text();
                }),
                listFiles: async () => fetch("/api/file/list").then(r => r.json()),
            },
            systems: {
                list:    async () => fetch("/api/project/current").then(r => r.ok ? r.json().then(p => p.systems||[]) : []),
                scan:    async (id) => fetch(`/api/system/${id}/scan`).then(r => r.json()),
                execute: async (id, action, payload={}) => fetch(`/api/system/${id}/execute`, {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ action, payload }),
                }).then(r => r.json()),
            },
            ui: {
                openFile: (p)   => emit("file:open", p),
                notify:   (msg) => emit("ui:notify", { message: msg }),
                refresh:  ()    => emit("explorer:refresh"),
            },
            log,
            warn: wrn,
            error: err,
            // Convenience: structured console object
            console: { log, warn: wrn, error: err, info: log },
        };
    }
}

export default new FrontendScriptEngine();