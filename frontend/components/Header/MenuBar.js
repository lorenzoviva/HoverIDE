import Dropdown from "./Dropdown.js";
import { emit } from "../../core/EventBus.js";
import OpenProjectModal     from "../modals/OpenProjectModal.js";
import CreateProjectModal   from "../modals/CreateProjectModal.js";
import ProjectSettingsModal from "../modals/ProjectSettingsModal.js";
import AddSystemModal       from "../modals/AddSystemModal.js";
import ChangeBranchModal    from "../modals/ChangeBranchModal.js";
import IDESettingsModal     from "../modals/IDESettingsModal.js";
import SystemSettingsModal  from "../modals/SystemSettingsModal.js";
import SystemScanModal      from "../modals/SystemScanModal.js";
import HoverScriptsModal    from "../modals/HoverScriptsModal.js";
import { getCurrentProject } from "../../services/ProjectService.js";
import { on } from "../../core/EventBus.js";

export default class MenuBar {

    async render() {
        const bar = document.createElement("div");
        bar.className = "menu-bar";
        this._bar = bar;
        await this._rebuild();

        on("project:changed",         () => this._rebuild());
        on("project:systems:changed", () => this._rebuild());

        return bar;
    }

    openOpenProjectModal() {
        new OpenProjectModal().open();
    }

    async _rebuild() {
        const menus = await this._buildMenus();
        this._bar.innerHTML = "";
        menus.forEach(menu => {
            this._bar.appendChild(new Dropdown(menu.label, menu.items).render());
        });
    }

    async _buildMenus() {
        let project = null;
        try { project = await getCurrentProject(); } catch { /* no project */ }

        const menus = [
            {
                label: "HoverIDE",
                items: [
                    { label: "Change branch",  action: () => new ChangeBranchModal().open() },
                    { label: "Edit HoverIDE",  action: () => this._editHoverIDE() },
                    { label: "Settings",       action: () => new IDESettingsModal().open() },
                ],
            },
            {
                label: "Project",
                items: [
                    { label: "Open project",    action: () => new OpenProjectModal().open() },
                    { label: "Create project",  action: () => new CreateProjectModal().open() },
                    ...(project ? [
                        { label: "Add system",       action: () => new AddSystemModal().open() },
                        { label: "Project settings", action: () => new ProjectSettingsModal().open() },
                    ] : []),
                ],
            },
        ];

        // Systems menu — one entry per system with submenu
        if (project?.systems?.length) {
            menus.push({
                label: "Systems",
                items: project.systems.map(sys => ({
                    label: sys.id || sys.type,
                    submenu: this._systemSubmenu(sys),
                })),
            });
        } else {
            menus.push({
                label: "Systems",
                items: [
                    { label: "No systems — add one via Project", action: () => {} },
                ],
            });
        }

        // HoverScripts menu
        menus.push({
            label: "HoverScripts",
            items: [
                { label: "Manage scripts", action: () => new HoverScriptsModal().open() },
                ...(project ? [
                    { label: "New script",     action: () => this._newScript(project) },
                    { label: "Reload all",     action: () => this._reloadAllScripts() },
                ] : []),
            ],
        });

        return menus;
    }

    _systemSubmenu(sys) {
        return [
            { label: "Settings",     action: () => new SystemSettingsModal().open(sys) },
            { label: "Scan",         action: () => new SystemScanModal().open(sys) },
            { label: "Restart adapter", action: () => this._executeAction(sys, "restart") },
        ];
    }

    async _executeAction(sys, action) {
        try {
            const res = await fetch(`/api/system/${sys.id}/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
        } catch (e) {
            alert(`Action "${action}" failed: ${e.message}`);
        }
    }

    async _newScript(project) {
        const name = prompt("Script name (e.g. my-script.js):");
        if (!name) return;
        const filename = name.endsWith(".js") ? name : `${name}.js`;
        await fetch("/api/scripts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: filename }),
        });
        emit("file:open", `.hoverscripts/${filename}`);
    }

    async _reloadAllScripts() {
        // Unload then reload all — the engine re-scans the .hoverscripts dir
        await fetch("/api/scripts/reload-all", { method: "POST" }).catch(() => {});
    }

    _editHoverIDE() {
        import("../../core/ModalWindow.js").then(({ default: ModalWindow }) => {
            const win = new ModalWindow({ title: "Edit HoverIDE", width: 340 });
            win.render();
            const body = document.createElement("div");
            body.style.cssText = "font-size:11px;color:#ccc;line-height:1.6";
            body.textContent = "This will open the HoverIDE project, replacing the current context.";
            win.setContent(body);
            win.addFooterBtn("Cancel", "mw-btn--ghost", () => win.close());
            win.addFooterBtn("Open HoverIDE", "mw-btn--primary", async () => {
                const res = await fetch("/api/project/open", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "HoverIDE" }),
                });
                const project = await res.json();
                const { setProject } = await import("../../core/ProjectStore.js");
                setProject(project);
                emit("project:changed", project);
                win.close();
            });
            win.show();
        });
    }
}