import ModalWindow from "../../core/ModalWindow.js";
import BrowseField from "../../core/BrowseField.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

const BROWSE_FIELDS = [
    "rootPath",
    "localPath"
]
const FIELDS = [
    { key: "name",           label: "Project name" },
    { key: "projectGit",     label: "Project git URL" },
    { key: "rootPath",       label: "Root path" },
    { key: "rootBranch",     label: "Root branch" },
    { key: "localPath",      label: "Local (sandbox) path" },
    { key: "localBranch",    label: "Local branch" },
    { key: "hoverIDEGit",    label: "HoverIDE git URL" },
    { key: "hoverIDEBranch", label: "HoverIDE branch" },
];

export default class ProjectSettingsModal {

    open() {
        const project = getProject();
        if (!project) return;

        this.win = new ModalWindow({ title: `Project settings — ${project.name}`, width: 400 });
        this.win.render();

        const body = document.createElement("div");

        FIELDS.forEach(({ key, label }) => {
            if(BROWSE_FIELDS.includes(key)) {
                const folderField  = BrowseField.create({ label, key,  placeholder: project[key], value: project[key], mode: "folder" });
                 body.appendChild(folderField.wrapper);
            } else {
                const f = document.createElement("div");
                f.className = "mw-field";
                f.innerHTML = `<div class="mw-field-label">${label}</div>
                    <input class="mw-field-input" data-key="${key}" value="${project[key] || ""}" />`;
                body.appendChild(f);
            }
        });

        const toggle = document.createElement("div");
        toggle.className = "mw-raw-toggle";
        toggle.textContent = "▶ Advanced (raw JSON)";
        const rawPre = document.createElement("pre");
        rawPre.className = "mw-raw-json mw-hidden";
        rawPre.textContent = JSON.stringify(project, null, 2);
        let rawOpen = false;
        toggle.onclick = () => {
            rawOpen = !rawOpen;
            toggle.textContent = (rawOpen ? "▼" : "▶") + " Advanced (raw JSON)";
            rawPre.classList.toggle("mw-hidden", !rawOpen);
        };
        body.appendChild(toggle);
        body.appendChild(rawPre);

        this.win.setContent(body);
        this.win.addFooterBtn("Cancel", "mw-btn--ghost", () => this.win.close());
        this.win.addFooterBtn("Save", "mw-btn--primary", async () => {
            const updated = { ...project };
            body.querySelectorAll(".mw-field-input[data-key]").forEach(el => {
                updated[el.dataset.key] = el.value;
            });
            await fetch("/api/project/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            emit("project:changed", updated);
            this.win.close();
        });

        this.win.show();
    }
}