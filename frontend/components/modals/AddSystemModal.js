import ModalWindow from "../../core/ModalWindow.js";
import Wizard from "../../core/Wizard.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

// Config fields per system type — matches what each adapter actually uses
const SYSTEM_CONFIGS = {
    VanillaES6Frontend: [
        { key: "root",         label: "Root path",            placeholder: "frontend" },
        { key: "devServerUrl", label: "Dev server URL",       placeholder: "http://localhost:3000" },
    ],
    NodeJSBackend: [
        { key: "root",        label: "Root path",   placeholder: "backend" },
        { key: "startScript", label: "Start script", placeholder: "npm start" },
    ],
    ChromeExtension: [
        { key: "root",         label: "Root path",     placeholder: "extension" },
        { key: "manifestPath", label: "Manifest path",  placeholder: "extension/manifest.json" },
    ],
    ChromeExtensionPopup: [
        { key: "root",     label: "Root path",  placeholder: "extension" },
        { key: "popupUrl", label: "Popup URL",   placeholder: "chrome-extension://…/popup.html" },
    ],
    HoverIDEFrontend: [],
    HoverIDEBackend:  [],
};

export default class AddSystemModal {

    open() {
        const project = getProject();
        if (!project) return;

        const win = new ModalWindow({ title: "Add system", width: 400 });
        win.render();

        const wizard = new Wizard({
            steps: [
                {
                    title: "Type",
                    render(data) {
                        const grid = document.createElement("div");
                        grid.className = "mw-type-grid";

                        if (!data.type) data.type = Object.keys(SYSTEM_CONFIGS)[0];

                        Object.entries(SYSTEM_CONFIGS).forEach(([type, fields]) => {
                            const card = document.createElement("div");
                            card.className = "mw-type-card" + (type === data.type ? " mw-type-card--selected" : "");
                            card.innerHTML = `<div class="mw-type-name">${type}</div>
                                <div class="mw-type-desc">${fields.length ? fields.map(f => f.key).join(", ") : "no config required"}</div>`;
                            card.onclick = () => {
                                data.type = type;
                                grid.querySelectorAll(".mw-type-card").forEach(c => c.classList.remove("mw-type-card--selected"));
                                card.classList.add("mw-type-card--selected");
                            };
                            grid.appendChild(card);
                        });
                        return grid;
                    },
                    validate: (data) => !!data.type,
                },
                {
                    title: "Config",
                    render(data) {
                        const wrap = document.createElement("div");
                        const fields = SYSTEM_CONFIGS[data.type] || [];

                        if (!fields.length) {
                            const note = document.createElement("div");
                            note.style.cssText = "font-size:11px;color:#888;padding:8px 0";
                            note.textContent = `${data.type} requires no additional configuration.`;
                            wrap.appendChild(note);
                            return wrap;
                        }

                        fields.forEach(({ key, label, placeholder }) => {
                            const f = document.createElement("div");
                            f.className = "mw-field";
                            f.innerHTML = `<div class="mw-field-label">${label}</div>
                                <input class="mw-field-input" data-key="${key}" placeholder="${placeholder}">`;
                            wrap.appendChild(f);
                        });
                        return wrap;
                    },
                    collect(data) {
                        data.config = {};
                        document.querySelectorAll(".mw-field-input[data-key]").forEach(el => {
                            if (el.value) data.config[el.dataset.key] = el.value;
                        });
                    },
                },
                {
                    title: "Confirm",
                    render(data) {
                        const wrap = document.createElement("div");
                        const pre = document.createElement("pre");
                        pre.className = "mw-raw-json";
                        pre.style.maxHeight = "160px";
                        pre.textContent = JSON.stringify({ type: data.type, config: data.config }, null, 2);
                        wrap.appendChild(pre);
                        return wrap;
                    },
                },
            ],
            onFinish: async (data) => {
                const res = await fetch("/api/system/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectName: project.name, type: data.type, config: data.config || {} }),
                });
                if (!res.ok) { alert("Failed to add system"); return; }
                emit("project:systems:changed");
                win.close();
            },
            onCancel: () => win.close(),
        });

        win.setContent(wizard.render());
        win.show();
    }
}