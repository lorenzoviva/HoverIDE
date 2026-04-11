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
        this.emit("server.init", { systemId: this.system.id });
    }

    async scan() {
        const root = this.system.config.root || "backend";
        const routes = this._scanRoutes(root);
        return { routes };
    }

    async start() {
        await super.start();
        this._watchFiles();
        this.emit("server.started", { root: this.system.config.root });
    }

    async stop() {
        this._watchers.forEach(w => w.close());
        this._watchers = [];
        await super.stop();
        this.emit("server.stopped", {});
    }

    async execute(action, payload = {}) {
        switch (action) {
            case "restart":
                this.emit("server.restarting", {});
                // Signal parent process or PM2 — implementation is project-specific
                this.emit("server.restarted", {});
                break;
            case "listRoutes":
                return this._scanRoutes(this.system.config.root || "backend");
            default:
                throw new Error(`NodeJSAdapter: unknown action "${action}"`);
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
                relative: filename.replace(/\\/g, "/"),
            });
        });

        this._watchers.push(watcher);
    }

    _scanRoutes(rootDir) {
        const routes = [];
        if (!rootDir || !fs.existsSync(rootDir)) return routes;

        const walk = (dir) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) { walk(full); continue; }
                if (!entry.name.endsWith(".js")) continue;

                try {
                    const src = fs.readFileSync(full, "utf-8");
                    const matches = [...src.matchAll(/router\.(get|post|put|patch|delete)\(["'`]([^"'`]+)/g)];
                    matches.forEach(([, method, route]) => {
                        routes.push({ method: method.toUpperCase(), route, file: full });
                    });
                } catch { /* skip unreadable files */ }
            }
        };

        walk(rootDir);
        return routes;
    }
}