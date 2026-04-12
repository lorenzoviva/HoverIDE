import vm from "vm";
import fs from "fs";
import path from "path";
import eventBus from "../core/EventBus.js";
import { NODE_RUNTIME_DIR } from "../utils/const.js"
class ScriptEngine {

    constructor() {
        this._scripts = new Map();     // filename → { module, unsubscribe }
        this._projectPath = null;
    }

    async loadProject(project) {
        await this.unloadAll();
        this._projectPath = project.localPath;
        // TO-DO: REPLACE roject.rootPath with HoverIDE path
        const scriptsDir = path.join(NODE_RUNTIME_DIR, "..", ".hoverscripts", project.name);
        if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });

        for (const file of fs.readdirSync(scriptsDir)) {
            if (!file.endsWith(".js")) continue;
            await this._loadScript(path.join(scriptsDir, file));
        }
    }

    async _loadScript(filePath) {
        const name = path.basename(filePath);
        try {
            const src = fs.readFileSync(filePath, "utf-8");
            const mod = this._execute(src, filePath);

            const ctx = this._makeContext();

            if (typeof mod.onInit === "function") {
                await mod.onInit(ctx);
            }

            // Subscribe to all events
            const unsubscribe = eventBus.subscribeAll(async (event) => {
                if (typeof mod.onEvent === "function") {
                    try { await mod.onEvent(event, ctx); }
                    catch (e) { console.error(`[ScriptEngine] ${name} error in onEvent:`, e.message); }
                }
            });

            this._scripts.set(name, { mod, unsubscribe, filePath });
            console.log(`[ScriptEngine] Loaded: ${name}`);
        } catch (e) {
            console.error(`[ScriptEngine] Failed to load ${name}:`, e.message);
        }
    }

    _execute(src, filePath) {
        // Wrap in a module-like closure that returns the default export
        const wrapped = `
            (function(module, exports) {
                ${src}
            })
        `;

        const sandbox = vm.createContext({
            console,
            setTimeout,
            clearTimeout,
            Promise,
            module: { exports: {} },
            exports: {},
        });

        const fn = vm.runInContext(wrapped, sandbox, {
            filename: filePath,
            timeout: 5000,
        });

        const fakeModule = { exports: {} };
        fn(fakeModule, fakeModule.exports);

        // Support both `export default { ... }` (transpiled) and `module.exports = { ... }`
        return fakeModule.exports.default || fakeModule.exports;
    }

    _makeContext() {
        return {
            eventBus: {
                dispatch: (type, payload) => eventBus.dispatch({ type, payload }),
                subscribe: (type, handler) => eventBus.subscribe(type, handler),
            },
            fs: {
                // Controlled subset — read only for now
                readFile: (relPath) => {
                    if (!this._projectPath) throw new Error("No project loaded");
                    const full = path.resolve(this._projectPath, relPath);
                    if (!full.startsWith(this._projectPath)) throw new Error("Path traversal blocked");
                    return fs.readFileSync(full, "utf-8");
                },
                listFiles: (relDir = ".") => {
                    if (!this._projectPath) throw new Error("No project loaded");
                    const full = path.resolve(this._projectPath, relDir);
                    if (!full.startsWith(this._projectPath)) throw new Error("Path traversal blocked");
                    return fs.readdirSync(full);
                },
            },
        };
    }

    async unloadScript(name) {
        const entry = this._scripts.get(name);
        if (!entry) return;
        entry.unsubscribe();
        if (typeof entry.mod.onDispose === "function") {
            try { await entry.mod.onDispose(); } catch { /* ignore */ }
        }
        this._scripts.delete(name);
    }

    async unloadAll() {
        for (const name of this._scripts.keys()) {
            await this.unloadScript(name);
        }
    }

    list() {
        return [...this._scripts.keys()];
    }
}

export default new ScriptEngine();