import BaseAdapter from "./BaseAdapter.js";
import fs from "fs";
import path from "path";

export default class VanillaES6Adapter extends BaseAdapter {

    constructor(system) {
        super(system);
        this._watchers = [];
    }

    async start() {
        await super.start();
        this._watchFiles();
        this.emit("ui.started", { root: this.system.config.root });
    }

    async stop() {
        this._watchers.forEach(w => w.close());
        this._watchers = [];
        await super.stop();
    }

    async scan() {
        const root = this.system.config.root;
        if (!root || !fs.existsSync(root)) return { components: [], scripts: [] };

        const scripts = this._findByExt(root, ".js");
        const styles  = this._findByExt(root, ".css");
        const html    = this._findByExt(root, ".html");

        return { scripts, styles, html };
    }

    async execute(action, payload = {}) {
        switch (action) {
            case "scan": return this.scan();
            default: throw new Error(`VanillaES6Adapter: unknown action "${action}"`);
        }
    }

    _watchFiles() {
        const root = this.system.config.root;
        if (!root || !fs.existsSync(root)) return;

        const watcher = fs.watch(root, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            this.emit("fs.changed", {
                event:    eventType,
                path:     path.join(root, filename).replace(/\\/g, "/"),
                relative: filename,
            });
        });

        this._watchers.push(watcher);
    }

    _findByExt(dir, ext) {
        const results = [];
        const walk = (d) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                const full = path.join(d, e.name);
                if (e.isDirectory()) { walk(full); continue; }
                if (e.name.endsWith(ext)) results.push(full.replace(/\\/g, "/"));
            }
        };
        try { walk(dir); } catch { /* ignore */ }
        return results;
    }
}