import { listProjects, openProject } from "../services/ProjectService.js";

export default class ProjectSelector {

    constructor() {
        this.onSelect = null;
        this.onCreate = null;
    }

    render() {
        const root = document.createElement("div");

        const title = document.createElement("h2");
        title.innerText = "Select Project";
        root.appendChild(title);

        const list = document.createElement("div");

        const btnCreate = document.createElement("button");
        btnCreate.innerText = "+ Create Project";

        btnCreate.onclick = () => {
            const name = prompt("Project name?");
            if (!name) return;

            // minimal create flow (frontend-driven for now)
            this.onCreate?.({ name });
        };

        root.appendChild(btnCreate);

        //////////////////////////////////////////////////////
        // Load projects
        //////////////////////////////////////////////////////

        listProjects().then(projects => {
            projects.forEach(name => {
                const btn = document.createElement("button");
                btn.innerText = name;

                btn.onclick = async () => {
                    const project = await openProject(name);
                    this.onSelect?.(project);
                };

                list.appendChild(btn);
            });
        });

        root.appendChild(list);

        return root;
    }
}