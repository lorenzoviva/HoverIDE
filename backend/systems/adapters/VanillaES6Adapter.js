import BaseAdapter from "./BaseAdapter.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default class VanillaES6Adapter extends BaseAdapter {

    constructor(system) {
        super(system);
        this._watchers = [];
    }

    async start() {
        await super.start();
        this._watchFiles();
        this.emit("ui.started", {
            root:         this.system.config.root,
            devServerUrl: this.system.config.devServerUrl,
        });
    }

    async stop() {
        this._watchers.forEach(w => w.close());
        this._watchers = [];
        await super.stop();
    }

    async scan() {
        const root = this.system.config.root;
        if (!root || !fs.existsSync(root)) return {};

        const scripts    = this._findByExt(root, ".js");
        const styles     = this._findByExt(root, ".css");
        const html       = this._findByExt(root, ".html");
        const components = this._findComponents(scripts);

        return {
            root,
            entryPoint:  this._findEntry(root),
            gitBranch:   this._git("git branch --show-current", root),
            scripts,
            styles,
            html,
            components,
            sources: {
                scripts: this._readSources(scripts),
                styles:  this._readSources(styles),
                html:    this._readSources(html),
            },
        };
    }

    async execute(action) {
        if (action === "scan") return this.scan();
        throw new Error(`VanillaES6Adapter: unknown action "${action}"`);
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
            try {
                for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
                    const full = path.join(d, e.name);
                    if (e.isDirectory()) { walk(full); continue; }
                    if (e.name.endsWith(ext)) results.push(full.replace(/\\/g, "/"));
                }
            } catch { /* ignore */ }
        };
        if (dir) walk(dir);
        return results;
    }

    _readSources(filePaths, maxSizeKB = 64) {
        const sources = {};
        for (const fp of filePaths) {
            try {
                const stat = fs.statSync(fp);
                if (stat.size > maxSizeKB * 1024) {
                    sources[fp] = { truncated: true, sizeKB: Math.round(stat.size / 1024) };
                    continue;
                }
                sources[fp] = fs.readFileSync(fp, "utf-8");
            } catch { /* skip unreadable */ }
        }
        return sources;
    }

    _findComponents(scriptPaths) {
        return scriptPaths.filter(f => {
            try {
                const src = fs.readFileSync(f, "utf-8");
                return /export\s+default\s+class\s+\w+\s+extends\s+Component/.test(src);
            } catch { return false; }
        });
    }

    _findEntry(root) {
        for (const name of ["index.html", "main.html", "iframe.html", "index.js", "main.js"]) {
            const p = path.join(root, name);
            if (fs.existsSync(p)) return p.replace(/\\/g, "/");
        }
        return null;
    }

    _git(cmd, cwd) {
        try { return execSync(cmd, { cwd }).toString().trim(); }
        catch { return null; }
    }
}