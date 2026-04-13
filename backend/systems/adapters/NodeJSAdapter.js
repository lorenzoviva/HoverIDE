import BaseAdapter from "./BaseAdapter.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default class NodeJSAdapter extends BaseAdapter {

    constructor(system) {
        super(system);
        this._watchers = [];
    }

    async init() {
        this.emit("server.init", { root: this.system.config.root });
    }

    async start() {
        await super.start();
        this._watchFiles();
        this.emit("server.started", {
            root:        this.system.config.root,
            startScript: this.system.config.startScript,
        });
    }

    async stop() {
        this._watchers.forEach(w => w.close());
        this._watchers = [];
        await super.stop();
        this.emit("server.stopped", {});
    }

    async scan() {
        const root = this.system.config.root;
        const scripts = this._findJS(root);
        const routes  = this._scanRoutes(root);

        return {
            root,
            routes,
            dependencies:  this._readDependencies(root),
            entryPoint:    this.system.config.startScript || null,
            gitBranch:     this._git("git branch --show-current", root),
            gitLog:        this._gitLog(root, 5),
            sources: {
                scripts: this._readSources(scripts),
            },
        };
    }

    async execute(action) {
        switch (action) {
            case "restart":
                this.emit("server.restarting", {});
                this.emit("server.restarted", {});
                return { ok: true };
            case "listRoutes":
                return this._scanRoutes(this.system.config.root);
            case "install":
                execSync("npm install", { cwd: this.system.config.root, stdio: "pipe" });
                this.emit("server.deps.installed", {});
                return { ok: true };
            default:
                throw new Error(`NodeJSAdapter: unknown action "${action}"`);
        }
    }

    _watchFiles() {
        const root = this.system.config.root;
        if (!root || !fs.existsSync(root)) return;
        const watcher = fs.watch(root, { recursive: true }, (eventType, filename) => {
            if (!filename || filename.includes("node_modules")) return;
            this.emit("fs.changed", {
                event:    eventType,
                path:     path.join(root, filename).replace(/\\/g, "/"),
                relative: filename.replace(/\\/g, "/"),
            });
        });
        this._watchers.push(watcher);
    }

    _findJS(rootDir) {
        const results = [];
        if (!rootDir || !fs.existsSync(rootDir)) return results;
        const walk = (dir) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                if (e.name === "node_modules" || e.name.startsWith(".")) continue;
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full); continue; }
                if (e.name.endsWith(".js")) results.push(full.replace(/\\/g, "/"));
            }
        };
        try { walk(rootDir); } catch { /* ignore */ }
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
            } catch { /* skip */ }
        }
        return sources;
    }

    _scanRoutes(rootDir) {
        const routes = [];
        if (!rootDir || !fs.existsSync(rootDir)) return routes;
        const walk = (dir) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                if (e.name === "node_modules") continue;
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full); continue; }
                if (!e.name.endsWith(".js")) continue;
                try {
                    const src = fs.readFileSync(full, "utf-8");
                    for (const [, method, route] of src.matchAll(/router\.(get|post|put|patch|delete)\(["'`]([^"'`]+)/g)) {
                        routes.push({ method: method.toUpperCase(), route, file: path.relative(rootDir, full) });
                    }
                } catch { /* skip */ }
            }
        };
        try { walk(rootDir); } catch { /* ignore */ }
        return routes;
    }

    _readDependencies(rootDir) {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
            return {
                dependencies:    Object.keys(pkg.dependencies    || {}),
                devDependencies: Object.keys(pkg.devDependencies || {}),
            };
        } catch { return {}; }
    }

    _git(cmd, cwd) {
        try { return execSync(cmd, { cwd }).toString().trim(); }
        catch { return null; }
    }

    _gitLog(cwd, n) {
        try {
            return execSync(`git log -${n} --pretty=format:"%h|%s|%ar"`, { cwd })
                .toString().split("\n").filter(Boolean)
                .map(l => { const [hash, subject, rel] = l.split("|"); return { hash, subject, rel }; });
        } catch { return []; }
    }
}