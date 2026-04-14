import ModalWindow from "../../core/ModalWindow.js";
import Wizard from "../../core/Wizard.js";
import BrowseField from "../../core/BrowseField.js";
import { emit } from "../../core/EventBus.js";
import { setProject } from "../../core/ProjectStore.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";

function plainField(label, key, placeholder = "") {
    const wrap = document.createElement("div");
    wrap.className = "mw-field";
    wrap.innerHTML = `<div class="mw-field-label">${label}</div>
        <input class="mw-field-input" data-key="${key}" placeholder="${placeholder}" />`;
    return wrap;
}

function checkRow(label, checked = false) {
    const wrap = document.createElement("div");
    wrap.className = "mw-check-row";
    wrap.style.margin = "6px 0";
    const id = `cr-${Date.now()}-${Math.random()}`;
    wrap.innerHTML = `<input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
        <label for="${id}">${label}</label>`;
    const cb = wrap.querySelector("input");
    return { wrap, cb };
}

export default class CreateProjectModal {

    open() {
        this.win = new ModalWindow({ title: "Create project", width: 440 });

        const wizard = new Wizard({
            steps: [
                {
                    title: "Identity",
                    render() {
                        const wrap = document.createElement("div");
                        wrap.appendChild(plainField("Project name",    "name",       "my-project"));
                        wrap.appendChild(plainField("Project git URL", "projectGit", "https://github.com/user/repo.git"));
                        return wrap;
                    },
                    collect(data) {
                        data.name       = document.querySelector('[data-key="name"]')?.value;
                        data.projectGit = document.querySelector('[data-key="projectGit"]')?.value;
                    },
                    validate(data) { return !!data.name; },
                },
                {
                    title: "Root repo",
                    render(data) {
                        const wrap = document.createElement("div");

                        const rootF = BrowseField.create({
                            label: "Root path (where to clone / existing repo)",
                            key: "rootPath", placeholder: "H:/projects/my-project", mode: "folder",
                        });
                        wrap.appendChild(rootF.wrapper);
                        wrap.appendChild(plainField("Root branch", "rootBranch", "main"));

                        return wrap;
                    },
                    collect(data) {
                        data.rootPath   = document.querySelector('[data-key="rootPath"]')?.value;
                        data.rootBranch = document.querySelector('[data-key="rootBranch"]')?.value || "main";
                    },
                    validate(data) { return !!data.rootPath; },
                },
                {
                    title: "Sandbox",
                    render(data) {
                        const wrap = document.createElement("div");
                        const settings = getIDESettings();

                        // Option A: auto-create local branch
                        const { wrap: branchRow, cb: branchCb } = checkRow("Create local sandbox branch automatically", true);
                        wrap.appendChild(branchRow);

                        const branchField = plainField("Local branch name", "localBranch", "sandbox");
                        wrap.appendChild(branchField);

                        branchCb.onchange = () => {
                            branchField.style.opacity = branchCb.checked ? "1" : ".4";
                            branchField.querySelector("input").disabled = !branchCb.checked;
                        };
                        data._createBranch = true;

                        branchCb.onchange = () => {
                            data._createBranch = branchCb.checked;
                            branchField.style.opacity = branchCb.checked ? "1" : ".4";
                        };

                        // Option B: auto-clone into workspace
                        const { wrap: cloneRow, cb: cloneCb } = checkRow("Clone into HoverIDE sandbox workspace automatically");
                        wrap.appendChild(cloneRow);

                        // Workspace root picker — visible when cloneCb checked
                        const wsWrap = document.createElement("div");
                        wsWrap.style.cssText = "margin-top:4px;opacity:.4;pointer-events:none;transition:opacity .15s";

                        const wsField = BrowseField.create({
                            label: "Sandbox workspace root",
                            key: "sandboxWorkspaceRoot",
                            placeholder: settings.sandboxWorkspace || "H:/sandboxes",
                            mode: "folder",
                        });
                        wsField.input.value = settings.sandboxWorkspace || "";
                        wsWrap.appendChild(wsField.wrapper);

                        const note = document.createElement("div");
                        note.style.cssText = "font-size:10px;color:#666;margin-top:4px";
                        note.textContent = "The project will be cloned into: <workspace>/<project-name>";
                        wsWrap.appendChild(note);
                        wrap.appendChild(wsWrap);

                        // Manual path — hidden when cloneCb checked
                        const manualWrap = document.createElement("div");
                        manualWrap.style.marginTop = "8px";
                        const localF = BrowseField.create({
                            label: "Local (sandbox) path",
                            key: "localPath",
                            placeholder: "H:/projects/sandboxes/my-project",
                            mode: "folder",
                        });
                        manualWrap.appendChild(localF.wrapper);
                        wrap.appendChild(manualWrap);

                        cloneCb.onchange = () => {
                            const on = cloneCb.checked;
                            wsWrap.style.opacity    = on ? "1"    : ".4";
                            wsWrap.style.pointerEvents = on ? "auto" : "none";
                            manualWrap.style.opacity   = on ? ".4"  : "1";
                            manualWrap.style.pointerEvents = on ? "none" : "auto";
                            data._autoClone = on;
                        };

                        return wrap;
                    },
                    collect(data) {
                        data.localBranch = document.querySelector('[data-key="localBranch"]')?.value || "sandbox";

                        const wsRoot   = document.querySelector('[data-key="sandboxWorkspaceRoot"]')?.value?.trim();
                        const manualLP = document.querySelector('[data-key="localPath"]')?.value?.trim();

                        if (data._autoClone && wsRoot) {
                            // Persist workspace setting if not already set
                            const s = getIDESettings();
                            if (!s.sandboxWorkspace) updateIDESettings({ sandboxWorkspace: wsRoot });
                            // Derive localPath from workspace + project name
                            data.localPath          = `${wsRoot}/${data.name}`.replace(/\\/g, "/");
                            data.sandboxWorkspaceRoot = wsRoot;
                        } else {
                            data.localPath = manualLP || `${data.rootPath}-sandbox`;
                        }
                    },
                    validate(data) { return !!data.localBranch; },
                },
                {
                    title: "HoverIDE",
                    render() {
                        const wrap = document.createElement("div");
                        wrap.appendChild(plainField("HoverIDE git URL",  "hoverIDEGit",    "https://github.com/lorenzoviva/HoverIDE.git"));
                        wrap.appendChild(plainField("HoverIDE branch",   "hoverIDEBranch", "main"));
                        return wrap;
                    },
                    collect(data) {
                        data.hoverIDEGit    = document.querySelector('[data-key="hoverIDEGit"]')?.value;
                        data.hoverIDEBranch = document.querySelector('[data-key="hoverIDEBranch"]')?.value || "main";
                    },
                },
            ],
            onFinish: async (data) => {
                const res = await fetch("/api/project/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) { alert(`Init failed: ${(await res.json()).error}`); return; }
                const { project } = await res.json();
                setProject(project);
                emit("project:changed", project);
                this.win.close();
            },
            onCancel: () => this.win.close(),
        });

        this.win.render();
        this.win.setContent(wizard.render());
        this.win.show();
    }
}