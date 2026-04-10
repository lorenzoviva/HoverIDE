import ModalWindow from "../../core/ModalWindow.js";
import Wizard from "../../core/Wizard.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

const SYSTEM_TYPES = {
    VanillaES6Frontend: {
        desc: "Static HTML/JS/CSS frontend",
        fields: [
            { label: "Root path", key: "root", placeholder: "frontend" },
            { label: "Dev server URL pattern", key: "devServerUrl", placeholder: "http://localhost:3000/*" },
        ]
    },
    NodeJSBackend: {
        desc: "Node.js / Express API server",
        fields: [
            { label: "Root path", key: "root", placeholder: "backend" },
            { label: "Start script", key: "startScript", placeholder: "npm start" },
        ]
    },
    ChromeExtension: {
        desc: "Chrome MV3 extension",
        fields: [
            { label: "Root path", key: "root", placeholder: "extension" },
            { label: "Manifest path", key: "manifestPath", placeholder: "extension/manifest.json" },
        ]
    },
    ChromeExtensionPopup: {
        desc: "Extension popup page",
        fields: [
            { label: "Root path", key: "root", placeholder: "extension" },
            { label: "Popup URL", key: "popupUrl", placeholder: "chrome-extension://…/popup.html" },
        ]
    },
    HoverIDEFrontend: { desc: "HoverIDE frontend (extends VanillaES6)", fields: [] },
    HoverIDEBackend:  { desc: "HoverIDE backend (extends NodeJS)",      fields: [] },
};

export default class AddSystemModal {

    open() {
        const project = getProject();
        if (!project) return;

        this.win = new ModalWindow({ title: "Add system", width: 400 });
        this.win.render();

        let selectedType = Object.keys(SYSTEM_TYPES)[0];

        const wizard = new Wizard({
            steps: [
                {
                    title: "Type",
                    render: (data) => {
                        const grid = document.createElement("div");
                        grid.className = "mw-type-grid";
                        Object.entries(SYSTEM_TYPES).forEach(([type, meta]) => {
                            const card = document.createElement("div");
                            card.className = "mw-type-card" + (type === selectedType ? " mw-type-card--selected" : "");
                            card.innerHTML = `<div class="mw-type-name">${type}</div><div class="mw-type-desc">${meta.desc}</div>`;
                            card.onclick = () => {
                                selectedType = type;
                                data.type = type;
                                grid.querySelectorAll(".mw-type-card").forEach(c => c.classList.remove("mw-type-card--selected"));
                                card.classList.add("mw-type-card--selected");
                            };
                            grid.appendChild(card);
                        });
                        data.type = selectedType;
                        return grid;
                    },
                    validate: (data) => !!data.type
                },
                {
                    title: "Config",
                    render: (data) => {
                        const wrap = document.createElement("div");
                        const typeMeta = SYSTEM_TYPES[data.type];
                        if (!typeMeta?.fields?.length) {
                            wrap.innerHTML = `<div style="color:#888;font-size:11px">No configuration required for ${data.type}.</div>`;
                            return wrap;
                        }
                        typeMeta.fields.forEach(({ label, key, placeholder }) => {
                            const f = document.createElement("div");
                            f.className = "mw-field";
                            f.innerHTML = `<div class="mw-field-label">${label}</div>
                                <input class="mw-field-input" data-key="${key}" placeholder="${placeholder}" />`;
                            wrap.appendChild(f);
                        });
                        return wrap;
                    },
                    collect: (data) => {
                        data.config = data.config || {};
                        document.querySelectorAll(".mw-field-input[data-key]").forEach(el => {
                            data.config[el.dataset.key] = el.value;
                        });
                    }
                },
                {
                    title: "Confirm",
                    render: (data) => {
                        const wrap = document.createElement("div");
                        wrap.innerHTML = `
                            <div style="font-size:11px;color:#888;margin-bottom:8px">Adding to <strong style="color:#ccc">${project.name}</strong>:</div>
                            <div style="background:#1a1a1a;border-radius:3px;padding:10px;font-size:11px;color:#ccc;font-family:monospace">
                                ${JSON.stringify({ type: data.type, config: data.config }, null, 2)
                                    .replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")}
                            </div>`;
                        return wrap;
                    }
                }
            ],
            onFinish: async (data) => {
                await fetch("/api/system/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectName: project.name, type: data.type, config: data.config }),
                });
                emit("project:systems:changed");
                this.win.close();
            },
            onCancel: () => this.win.close(),
        });

        this.win.setContent(wizard.render());
        this.win.show();
    }
}