import ModalWindow from "../../core/ModalWindow.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";
import scriptEngine from "../../core/ScriptEngine.js";

const SCRIPT_TEMPLATE = `// HoverScript — runs in the browser (frontend context)
// Available: ctx.eventBus, ctx.fs, ctx.systems, ctx.ui, ctx.log

export default {

    onInit(ctx) {
        ctx.log("Script loaded");
    },

    onEvent(event, ctx) {
        // event.type  — event name (e.g. "file:open", "backend:fs.changed")
        // event.payload — full envelope
    },

    onDispose() {
        ctx.log("Script unloaded");
    },
};
`;

export default class HoverScriptsModal {

    async open() {
        const project = getProject();
        if (!project) return;

        const win = new ModalWindow({ title: "HoverScripts", width: 420 });
        win.render();

        const body = document.createElement("div");
        win.setContent(body);
        win.addFooterBtn("Close", "mw-btn--ghost", () => win.close());
        win.show();

        // Ensure scripts are loaded — no-op if already loaded
        await scriptEngine.loadAll();
        this._render(body, project, win);
    }

    // Synchronous render — uses already-loaded state from engine
    _render(body, project, win) {
        body.innerHTML = "";

        const loaded  = scriptEngine.list();

        // Fetch disk list for "exists but not loaded" state
        fetch("/api/scripts/list").then(r => r.json()).then(diskNames => {
            body.innerHTML = "";  // clear loading state
            this._renderList(body, project, win, loaded, diskNames);
        }).catch(() => {
            this._renderList(body, project, win, loaded, loaded);
        });

        // Show loading indicator briefly
        const loading = document.createElement("div");
        loading.style.cssText = "font-size:11px;color:#555;padding:4px 0";
        loading.textContent = "Loading…";
        body.appendChild(loading);
    }

    _renderList(body, project, win, loadedNames, diskNames) {
        const loadedSet = new Set(loadedNames);

        if (!diskNames.length) {
            const empty = document.createElement("div");
            empty.style.cssText = "font-size:11px;color:#666;margin-bottom:12px;padding:8px;background:#1a1a1a;border-radius:3px";
            empty.textContent = "No scripts yet. Create one below.";
            body.appendChild(empty);
        } else {
            const listLabel = document.createElement("div");
            listLabel.className = "mw-field-label";
            listLabel.style.marginBottom = "6px";
            listLabel.textContent = "Scripts";
            body.appendChild(listLabel);

            diskNames.forEach(name => {
                const isLoaded = loadedSet.has(name);
                const row = document.createElement("div");
                row.style.cssText = "display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:3px;border:1px solid rgba(255,255,255,.07);margin-bottom:4px";

                // Status dot
                const dot = document.createElement("span");
                dot.title = isLoaded ? "Running" : "Not loaded";
                dot.style.cssText = `width:6px;height:6px;border-radius:50%;flex-shrink:0;background:${isLoaded ? "#73c991" : "#555"}`;
                dot.style.cursor = "default";

                const label = document.createElement("span");
                label.style.cssText = "flex:1;font-size:11px;font-family:monospace;color:#ccc";
                label.textContent = name;

                const openBtn = document.createElement("button");
                openBtn.className = "mw-btn mw-btn--ghost";
                openBtn.style.padding = "2px 8px";
                openBtn.textContent = "Edit";
                openBtn.onclick = () => {
                    emit("file:open", `.hoverscripts/${name}`);
                    win.close();
                };

                const reloadBtn = document.createElement("button");
                reloadBtn.className = "mw-btn mw-btn--ghost";
                reloadBtn.style.padding = "2px 8px";
                reloadBtn.textContent = isLoaded ? "Reload" : "Load";
                reloadBtn.onclick = async () => {
                    await scriptEngine.reload(name);
                    this._render(body, project, win);
                };

                const unloadBtn = document.createElement("button");
                unloadBtn.className = "mw-btn mw-btn--ghost";
                unloadBtn.style.cssText = "padding:2px 8px;color:#f48771";
                unloadBtn.textContent = "Unload";
                unloadBtn.style.display = isLoaded ? "inline-block" : "none";
                unloadBtn.onclick = async () => {
                    await scriptEngine.unload(name);
                    this._render(body, project, win);
                };

                row.appendChild(dot);
                row.appendChild(label);
                row.appendChild(openBtn);
                row.appendChild(reloadBtn);
                row.appendChild(unloadBtn);
                body.appendChild(row);
            });
        }

        // New script form
        const sep = document.createElement("div");
        sep.style.cssText = "border-top:1px solid rgba(255,255,255,.06);margin:10px 0";
        body.appendChild(sep);

        const newLabel = document.createElement("div");
        newLabel.className = "mw-field-label";
        newLabel.style.marginBottom = "6px";
        newLabel.textContent = "New script";
        body.appendChild(newLabel);

        const nameWrap = document.createElement("div");
        nameWrap.style.cssText = "display:flex;gap:6px;align-items:center";
        const nameInput = document.createElement("input");
        nameInput.className = "mw-field-input";
        nameInput.style.flex = "1";
        nameInput.placeholder = "my-script.js";

        const createBtn = document.createElement("button");
        createBtn.className = "mw-btn mw-btn--primary";
        createBtn.textContent = "Create";
        createBtn.onclick = async () => {
            let name = nameInput.value.trim();
            if (!name) return;
            if (!name.endsWith(".js")) name += ".js";
            await fetch("/api/scripts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, content: SCRIPT_TEMPLATE }),
            });
            // Auto-load and open for editing
            await scriptEngine.reload(name);
            emit("file:open", `.hoverscripts/${name}`);
            win.close();
        };
        nameWrap.appendChild(nameInput);
        nameWrap.appendChild(createBtn);
        body.appendChild(nameWrap);
    }
}