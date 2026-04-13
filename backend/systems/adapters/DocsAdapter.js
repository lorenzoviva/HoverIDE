import BaseAdapter from "./BaseAdapter.js";
import fs from "fs";
import path from "path";

export default class DocsAdapter extends BaseAdapter {

    async start() {
        await super.start();
        this._watchDocs();
        this.emit("docs.started", { root: this.system.config.root });
    }

    async stop() {
        if (this._watcher) { this._watcher.close(); this._watcher = null; }
        await super.stop();
    }

    async scan() {
        const root = this.system.config.root || ".";
        const mdFiles = this._findMarkdown(root);

        return {
            root,
            files: mdFiles,
            // Full content of every markdown file, keyed by relative path
            docs: this._readDocs(root, mdFiles),
            // Extracted headings index for navigation
            index: this._buildIndex(root, mdFiles),
        };
    }

    async execute(action, payload = {}) {
        switch (action) {
            case "scan":
                return this.scan();
            case "read":
                if (!payload.path) throw new Error("read requires payload.path");
                return { content: fs.readFileSync(payload.path, "utf-8") };
            default:
                throw new Error(`DocsAdapter: unknown action "${action}"`);
        }
    }

    _watchDocs() {
        const root = this.system.config.root || ".";
        if (!fs.existsSync(root)) return;
        this._watcher = fs.watch(root, { recursive: true }, (eventType, filename) => {
            if (!filename?.endsWith(".md")) return;
            this.emit("docs.changed", {
                event: eventType,
                path:  path.join(root, filename).replace(/\\/g, "/"),
            });
        });
    }

    _findMarkdown(root) {
        const results = [];
        if (!root || !fs.existsSync(root)) return results;
        const walk = (dir) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                if (e.name === "node_modules" || e.name.startsWith(".")) continue;
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full); continue; }
                if (e.name.endsWith(".md")) results.push(full.replace(/\\/g, "/"));
            }
        };
        try { walk(root); } catch { /* ignore */ }
        return results;
    }

    _readDocs(root, filePaths) {
        const docs = {};
        for (const fp of filePaths) {
            try {
                const rel = path.relative(root, fp).replace(/\\/g, "/");
                docs[rel] = fs.readFileSync(fp, "utf-8");
            } catch { /* skip */ }
        }
        return docs;
    }

    _buildIndex(root, filePaths) {
        // Extract H1-H3 headings with their file and line number for navigation
        const index = [];
        for (const fp of filePaths) {
            try {
                const rel  = path.relative(root, fp).replace(/\\/g, "/");
                const lines = fs.readFileSync(fp, "utf-8").split("\n");
                lines.forEach((line, i) => {
                    const m = line.match(/^(#{1,3})\s+(.+)/);
                    if (!m) return;
                    index.push({
                        file:  rel,
                        line:  i + 1,
                        level: m[1].length,
                        title: m[2].trim(),
                    });
                });
            } catch { /* skip */ }
        }
        return index;
    }
}