import ModalWindow from "../../core/ModalWindow.js";
import Wizard from "../../core/Wizard.js";
import BrowseField from "../../core/BrowseField.js";
import { emit } from "../../core/EventBus.js";
import { setProject } from "../../core/ProjectStore.js";

function field(label, key, placeholder = "") {
    const wrap = document.createElement("div");
    wrap.className = "mw-field";
    wrap.innerHTML = `<div class="mw-field-label">${label}</div>
        <input class="mw-field-input" data-key="${key}" placeholder="${placeholder}" />`;
    return wrap;
}

export default class CreateProjectModal {

    open() {
        this.win = new ModalWindow({ title: "Create project", width: 420 });
        const el = this.win.render();

        const wizard = new Wizard({
            title: "Create project",
            steps: [
                {
                    title: "Identity",
                    render() {
                        const f = document.createDocumentFragment();
                        f.appendChild(field("Project name", "name", "my-project"));
                        f.appendChild(field("Project git URL", "projectGit", "https://github.com/user/repo.git"));
                        const wrap = document.createElement("div");
                        wrap.appendChild(f);
                        return wrap;
                    },
                    collect(data) {
                        data.name       = document.querySelector('[data-key="name"]')?.value;
                        data.projectGit = document.querySelector('[data-key="projectGit"]')?.value;
                    },
                    validate(data) { return !!data.name; }
                },
                {
                    title: "Paths",
                    render() {
                        const wrap = document.createElement("div");
                        const rootF  = BrowseField.create({ label: "Root path",             key: "rootPath",  placeholder: "H:/projects/my-project",       mode: "folder" });
                        const localF = BrowseField.create({ label: "Local (sandbox) path",  key: "localPath", placeholder: "H:/projects/sandboxes/my-project", mode: "folder" });
                        wrap.appendChild(rootF.wrapper);
                        wrap.appendChild(localF.wrapper);
                        // plain field for branches (no browse)
                        ["rootBranch","localBranch"].forEach(k => {
                            const f = document.createElement("div");
                            f.className = "mw-field";
                            f.innerHTML = `<div class="mw-field-label">${k}</div>
                                <input class="mw-field-input" data-key="${k}" placeholder="main" />`;
                            wrap.appendChild(f);
                        });
                        return wrap;
                    },
                    collect(data) {
                        ["rootPath","rootBranch","localPath","localBranch"].forEach(k => {
                            data[k] = document.querySelector(`[data-key="${k}"]`)?.value;
                        });
                    }
                },
                {
                    title: "HoverIDE",
                    render() {
                        const wrap = document.createElement("div");
                        wrap.appendChild(field("HoverIDE git URL", "hoverIDEGit", "https://github.com/lorenzoviva/HoverIDE.git"));
                        wrap.appendChild(field("HoverIDE branch", "hoverIDEBranch", "main"));
                        return wrap;
                    },
                    collect(data) {
                        data.hoverIDEGit    = document.querySelector('[data-key="hoverIDEGit"]')?.value;
                        data.hoverIDEBranch = document.querySelector('[data-key="hoverIDEBranch"]')?.value;
                    }
                }
            ],
            onFinish: async (data) => {
                const res = await fetch("/api/project/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const { project } = await res.json();
                setProject(project);
                emit("project:changed", project);
                this.win.close();
            },
            onCancel: () => this.win.close(),
        });

        this.win.setContent(wizard.render());
        this.win.show();
    }
}