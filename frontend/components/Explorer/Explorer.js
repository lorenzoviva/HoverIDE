import Component from "../../core/Component.js";
import { listFiles } from "../../services/FileService.js";
import { getStatus } from "../../services/GitService.js";
import { emit, on } from "../../core/EventBus.js";
import { deleteFile } from "../../services/FileService.js";
import { hasProject } from "../../core/ProjectStore.js";

export default class Explorer extends Component {

    constructor(root) {
        super(root);
        this.tree = {};
        on("project:changed", () => this.mount());
        on("project:cleared", () => this.root.innerHTML = "");
    }

    async mount() {
        if (!hasProject()) {
            this.root.innerHTML = "";
            return;
        }

        const files = await listFiles();
        const git   = await getStatus();
        this.tree   = this.buildTree(files);

        this.root.innerHTML = "";
        this.root.appendChild(this.createToolbar());
        this.renderNode(this.tree, this.root, "", git, 0);

        on("file:delete", async (path) => {
            await deleteFile(path);
        });
    }

    createToolbar() {
        const bar = this.create("div", "explorer-toolbar");

        const newFile = this.create("button", "explorer-toolbar-btn");
        newFile.title = "New file";
        newFile.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M10 5H7V2H5v3H2v2h3v3h2V7h3V5z"/>
        </svg>`;
        newFile.onclick = () => emit("file:create");

        const newFolder = this.create("button", "explorer-toolbar-btn");
        newFolder.title = "New folder";
        newFolder.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.54 3.87L.5 3a2 2 0 012-2h3.19a2 2 0 011.28.46l.38.34a1 1 0 00.638.2H14a2 2 0 012 2v2h-2V3.5a.5.5 0 00-.5-.5H8.16a2 2 0 01-1.276-.46l-.38-.34a1 1 0 00-.638-.2H2.5a.5.5 0 00-.5.53l.06.87zM2 6h12v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
        </svg>`;
        newFolder.onclick = () => emit("folder:create");

        const refresh = this.create("button", "explorer-toolbar-btn");
        refresh.title = "Refresh";
        refresh.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a5 5 0 105 5h-1.5a3.5 3.5 0 11-3.5-3.5V6l3-3-3-3v2A5 5 0 008 3z"/>
        </svg>`;
        refresh.onclick = () => emit("explorer:refresh");

        bar.appendChild(newFile);
        bar.appendChild(newFolder);
        bar.appendChild(refresh);
        return bar;
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

    isLeaf(node) {
        return Object.keys(node).length === 0;
    }

    renderNode(node, container, prefix, git, depth) {
        const keys = Object.keys(node).sort((a, b) => {
            const aLeaf = this.isLeaf(node[a]);
            const bLeaf = this.isLeaf(node[b]);
            if (aLeaf !== bLeaf) return aLeaf ? 1 : -1;
            return a.localeCompare(b);
        });

        keys.forEach(key => {
            const fullPath = prefix ? `${prefix}/${key}` : key;
            const leaf     = this.isLeaf(node[key]);

            const row = this.create("div", "explorer-row");

            for (let i = 0; i < depth; i++) {
                row.appendChild(this.create("span", "explorer-indent"));
            }

            const toggle = this.create("span", leaf ? "explorer-toggle explorer-toggle--leaf" : "explorer-toggle");
            toggle.textContent = "▶";
            row.appendChild(toggle);

            const icon = this.create("span", "explorer-icon");
            icon.textContent = leaf ? "📄" : "📁";
            row.appendChild(icon);

            const label = this.create("span", "explorer-label");
            label.textContent = key;
            label.title = fullPath;
            label.style.color = this.getColor(fullPath, git);
            row.appendChild(label);

            const delBtn = this.create("button", "explorer-delete-btn");
            delBtn.title = "Delete";
            delBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1h3a.5.5 0 01.5.5v1H6v-1a.5.5 0 01.5-.5zM11 2.5v-1A1.5 1.5 0 009.5 0h-3A1.5 1.5 0 005 1.5v1H2.506a.58.58 0 00-.01 0H1.5a.5.5 0 000 1h.538l.853 10.66A2 2 0 004.885 16h6.23a2 2 0 001.994-1.84l.853-10.66h.538a.5.5 0 000-1h-.995a.59.59 0 00-.01 0H11z"/>
            </svg>`;
            delBtn.onclick = (e) => {
                e.stopPropagation();
                emit("file:delete", fullPath);
            };
            row.appendChild(delBtn);

            container.appendChild(row);

            if (!leaf) {
                const children = this.create("div", "explorer-children");
                children.style.display = "none";
                container.appendChild(children);

                this.renderNode(node[key], children, fullPath, git, depth + 1);

                // toggleChildren defined here in this closure scope — no more "not defined" error
                const toggleChildren = () => {
                    const isOpen = children.style.display === "none";
                    children.style.display = isOpen ? "block" : "none";
                    toggle.classList.toggle("explorer-toggle--open", isOpen);
                    icon.textContent = isOpen ? "📂" : "📁";
                };

                toggle.onclick = (e) => { e.stopPropagation(); toggleChildren(); };
                label.onclick  = (e) => { e.stopPropagation(); toggleChildren(); };

            } else {
                label.onclick = (e) => {
                    e.stopPropagation();
                    emit("file:open", fullPath);
                };
            }
        });
    }

    getColor(path, git) {
        return git.some(e => path.includes(e.file)) ? "#e2c08d" : "#73c991";
    }
}