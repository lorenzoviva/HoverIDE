import BaseAdapter from "./BaseAdapter.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import scriptEngine from "../../scripts/ScriptEngine.js";
import systemRuntime from "../../services/SystemRuntimeService.js";

export default class HoverIDEAdapter extends BaseAdapter {

    async init() {
        this.emit("hoveride.init", { version: this._readVersion() });
    }

    async start() {
        await super.start();
        this.emit("hoveride.started", {
            pid:     process.pid,
            uptime:  process.uptime(),
            version: this._readVersion(),
        });
    }

    async scan() {
        const root = process.cwd();

        return {
            version:     this._readVersion(),
            pid:         process.pid,
            uptime:      Math.round(process.uptime()),
            branch:      this._git("git branch --show-current", root),
            scripts:     scriptEngine.list(),
            adapters:    [...systemRuntime.adapters.keys()],
            routes:      this._scanRoutes(path.join(root, "backend", "api")),
            memoryMB:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        };
    }

    async execute(action, payload = {}) {
        switch (action) {
            case "restart":
                this.emit("hoveride.restarting", {});
                // Graceful exit — process manager (nodemon / PM2) will restart
                setTimeout(() => process.exit(0), 300);
                return { ok: true };

            case "gc":
                if (global.gc) global.gc();
                return { memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) };

            case "env":
                return { node: process.version, platform: process.platform };

            default:
                throw new Error(`HoverIDEAdapter: unknown action "${action}"`);
        }
    }

    _readVersion() {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
            return pkg.version || "unknown";
        } catch { return "unknown"; }
    }

    _git(cmd, cwd) {
        try { return execSync(cmd, { cwd }).toString().trim(); }
        catch { return null; }
    }

    _scanRoutes(apiDir) {
        const routes = [];
        if (!fs.existsSync(apiDir)) return routes;
        for (const file of fs.readdirSync(apiDir)) {
            if (!file.endsWith(".js")) continue;
            try {
                const src = fs.readFileSync(path.join(apiDir, file), "utf-8");
                for (const [, method, route] of src.matchAll(/router\.(get|post|put|patch|delete)\(["'`]([^"'`]+)/g)) {
                    routes.push({ method: method.toUpperCase(), route, file });
                }
            } catch { /* skip */ }
        }
        return routes;
    }
}