import Dropdown from "./Dropdown.js";
import { emit } from "../../core/EventBus.js";
import OpenProjectModal     from "../modals/OpenProjectModal.js";
import CreateProjectModal   from "../modals/CreateProjectModal.js";
import ProjectSettingsModal from "../modals/ProjectSettingsModal.js";
import AddSystemModal       from "../modals/AddSystemModal.js";
import ChangeBranchModal    from "../modals/ChangeBranchModal.js";
import IDESettingsModal    from "../modals/IDESettingsModal.js";
import { getCurrentProject } from "../../services/ProjectService.js";

export default class MenuBar {

    async render() {
        const bar = document.createElement("div");
        bar.className = "menu-bar";
        this._bar = bar;
        await this._rebuild();

        // Rebuild systems menu when systems change
        document.addEventListener("ide:project:systems:changed", () => this._rebuild());
        document.addEventListener("ide:project:changed",         () => this._rebuild());

        return bar;
    }

    openOpenProjectModal(){
        new OpenProjectModal().open();
    }

    async _rebuild() {
        this._bar.innerHTML = "";
        const menus = await this._buildMenus();
        menus.forEach(menu => {
            this._bar.appendChild(new Dropdown(menu.label, menu.items).render());
        });
    }

    async _buildMenus() {
        const project = await getCurrentProject();;

        return [
            {
                label: "HoverIDE",
                items: [
                    { label: "Change branch",  action: () => new ChangeBranchModal().open() },
                    { label: "Edit HoverIDE",  action: () => this._editHoverIDE() },
                    { label: "Settings",      action: () => new IDESettingsModal().open() },  // ← new
                ]
            },
            {
                label: "Project",
                items: [
                    { label: "Open project",    action: () => new OpenProjectModal().open() },
                    { label: "Create project",  action: () => new CreateProjectModal().open() },
                    ...(project ? [
                        { label: "Add system",      action: () => new AddSystemModal().open() },
                        { label: "Project settings",action: () => new ProjectSettingsModal().open() },
                    ] : []),
                ]
            },
            {
                label: "Systems",
                items: project?.systems?.length
                    ? project.systems.map(sys => ({
                        label: sys.id || sys.type,
                        submenu: this._systemMenu(sys),
                    }))
                    : [{ label: "No systems", action: () => {} }]
            }
        ];
    }

    _systemMenu(sys) {
        return [
            { label: "List files",  action: () => emit("system:list-files", sys) },
            { label: "Pages/URLs",  action: () => emit("system:pages", sys) },
        ];
    }

    _editHoverIDE() {
        const win = document.createElement("div");
        win.innerHTML = `<div style="font-size:11px;color:#ccc;margin-bottom:12px">
            This will open the HoverIDE project, replacing the current project context.
        </div>`;

        import("../../core/ModalWindow.js").then(({ default: ModalWindow }) => {
            const modal = new ModalWindow({ title: "Edit HoverIDE", width: 340 });
            modal.render();
            modal.setContent(win);
            modal.addFooterBtn("Cancel", "mw-btn--ghost", () => modal.close());
            modal.addFooterBtn("Open HoverIDE", "mw-btn--primary", async () => {
                const res = await fetch("/api/project/open", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "HoverIDE" }),
                });
                const project = await res.json();
                const { setProject } = await import("../../core/ProjectStore.js");
                const { emit } = await import("../../core/EventBus.js");
                setProject(project);
                emit("project:changed", project);
                modal.close();
            });
            modal.show();
        });
    }
}