import ModalWindow from "../../core/ModalWindow.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

const SCRIPT_TEMPLATE = `// HoverScript
// Available: ctx.eventBus, ctx.fs, ctx.systems

export default {

    onInit(ctx) {
        // Called once when the script is loaded
    },

    onEvent(event, ctx) {
        // Called for every event on the backend EventBus
        // event: { systemId, type, payload, timestamp }
    },

    onDispose() {
        // Called when the script is unloaded
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

        await this._render(body, project, win);
    }

    async _render(body, project, win) {
        body.innerHTML = "";

        // Load list from backend
        let scripts = [];
        try {
            const res = await fetch("/api/scripts/list");
            scripts = await res.json();
        } catch { scripts = []; }

        if (!scripts.length) {
            const empty = document.createElement("div");
            empty.style.cssText = "font-size:11px;color:#666;margin-bottom:12px;padding:8px;background:#1a1a1a;border-radius:3px";
            empty.textContent = `No scripts in ${project.localPath}/.hoverscripts/`;
            body.appendChild(empty);
        } else {
            const listLabel = document.createElement("div");
            listLabel.className = "mw-field-label";
            listLabel.style.marginBottom = "6px";
            listLabel.textContent = "Loaded scripts";
            body.appendChild(listLabel);

            scripts.forEach(name => {
                const row = document.createElement("div");
                row.style.cssText = "display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:3px;border:1px solid rgba(255,255,255,.07);margin-bottom:4px";

                const dot = document.createElement("span");
                dot.style.cssText = "width:6px;height:6px;border-radius:50%;background:#73c991;flex-shrink:0";

                const label = document.createElement("span");
                label.style.cssText = "flex:1;font-size:11px;font-family:monospace;color:#ccc";
                label.textContent = name;

                const openBtn = document.createElement("button");
                openBtn.className = "mw-btn mw-btn--ghost";
                openBtn.style.padding = "2px 8px";
                openBtn.textContent = "Open";
                openBtn.onclick = () => {
                    emit("file:open", `.hoverscripts/${name}`);
                    win.close();
                };

                const reloadBtn = document.createElement("button");
                reloadBtn.className = "mw-btn mw-btn--ghost";
                reloadBtn.style.padding = "2px 8px";
                reloadBtn.textContent = "Reload";
                reloadBtn.onclick = async () => {
                    await fetch("/api/scripts/reload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name }),
                    });
                    await this._render(body, project, win);
                };

                row.appendChild(dot);
                row.appendChild(label);
                row.appendChild(openBtn);
                row.appendChild(reloadBtn);
                body.appendChild(row);
            });
        }

        // Create new script
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
            emit("file:open", `.hoverscripts/${name}`);
            win.close();
        };
        nameWrap.appendChild(nameInput);
        nameWrap.appendChild(createBtn);
        body.appendChild(nameWrap);
    }
}