
import Component from "../../core/Component.js";
import { listFiles } from "../../services/FileService.js";
import { getStatus } from "../../services/GitService.js";
import { emit, on } from "../../core/EventBus.js";
import { createFileActions } from "../FileActions.js";
import { deleteFile } from "../../services/FileService.js";
export default class Explorer extends Component {

    constructor(root) {
        super(root);
        this.tree = {};
    }

    async mount() {
        const files = await listFiles();
        const git = await getStatus();
        console.log("Files: ", files, "git: ", git)
        this.tree = this.buildTree(files);

        this.root.innerHTML = "";
        this.renderNode(this.tree, this.root, "", git);

        on("explorer:refresh", () => this.mount());
        on("file:saved", () => this.mount());
        on("file:delete", async (path) => {
          await deleteFile(path);
          await this.mount(); // refresh explorer
        });
        const createBtn = document.createElement("button");
        createBtn.innerText = "+ File";

        createBtn.onclick = () => {
          emit("file:create");
        };

        this.root.prepend(createBtn);
    }

    buildTree(files) {
        const root = {};

        files.forEach(path => {
            if (path.includes("node_modules")) return;
            path = path.replaceAll("\\", "/").replaceAll("//", "/");
            const parts = path.split("/");
            let node = root;

            parts.forEach(p => {
                if (!node[p]) node[p] = {};
                node = node[p];
            });
        });

        return root;
    }

    renderNode(node, container, prefix, git) {
        Object.keys(node).forEach(key => {
            const fullPath = prefix ? `${prefix}/${key}` : key;

           const row = this.create("div", "explorer-row");

           const label = this.create("span", "explorer-label", key);
           label.style.color = this.getColor(fullPath, git);

           label.onclick = (e) => {
             e.stopPropagation();
             emit("file:open", fullPath);
           };

           const actions = createFileActions(fullPath);

           row.appendChild(label);
           row.appendChild(actions);
           container.appendChild(row);

            const children = this.create("div", "explorer-children");
            children.style.display = "none";

            row.onclick = () => {
                children.style.display = children.style.display === "none" ? "block" : "none";
            };

            container.appendChild(children);

            this.renderNode(node[key], children, fullPath, git);
        });
    }

    getColor(path, git) {
        if (!git.every((e) => !path.includes(e.file))) return "#e2c08d";
        if (git.every((e) => !path.includes(e.file))) return "#73c991";
//         if (git.modified.includes(path)) return "#e2c08d";
//         if (git.untracked.includes(path)) return "#73c991";
//         if (git.deleted.includes(path)) return "#f48771";
        return "#cccccc";
    }
}