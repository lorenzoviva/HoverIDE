import ModalWindow from "../../core/ModalWindow.js";
import { listProjects, openProject } from "../../services/ProjectService.js";
import { setProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

export default class OpenProjectModal {

    open() {
        this.win = new ModalWindow({ title: "Open project", width: 360 });
        this.win.render();
        this._load();
        this.win.show();
    }

    async _load() {
        const projects = await listProjects();
        let selected = projects[0] || null;

        const list = document.createElement("div");
        list.className = "mw-proj-list";

        projects.forEach(name => {
            const item = document.createElement("div");
            item.className = "mw-proj-item" + (name === selected ? " mw-proj-item--active" : "");
            item.innerHTML = `
                <div class="mw-proj-dot ${name === selected ? "mw-proj-dot--active" : ""}"></div>
                <span class="mw-proj-name">${name}</span>
            `;
            item.onclick = () => {
                selected = name;
                list.querySelectorAll(".mw-proj-item").forEach(el => el.classList.remove("mw-proj-item--active"));
                list.querySelectorAll(".mw-proj-dot").forEach(el => el.classList.remove("mw-proj-dot--active"));
                item.classList.add("mw-proj-item--active");
                item.querySelector(".mw-proj-dot").classList.add("mw-proj-dot--active");
            };
            list.appendChild(item);
        });

        if (!projects.length) {
            list.innerHTML = `<div style="color:#666;font-size:11px;padding:8px">No projects found.</div>`;
        }

        this.win.setContent(list);

        this.win.addFooterBtn("Cancel", "mw-btn--ghost", () => this.win.close());
        this.win.addFooterBtn("Open", "mw-btn--primary", async () => {
            if (!selected) return;
            const project = await openProject(selected);
            setProject(project);
            emit("project:changed", project);
            this.win.close();
        });
    }
}