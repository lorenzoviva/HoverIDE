import Component from "../../core/Component.js";
import ExplorerContextMenu from "./ExplorerContextMenu.js";
import { listFilesWithDirs, createFile, createFolder, renameFile } from "../../services/FileService.js";
import { getStatus } from "../../services/GitService.js";
import { emit, on } from "../../core/EventBus.js";
import { hasProject } from "../../core/ProjectStore.js";

export default class Explorer extends Component {

    constructor(root) {
        super(root);
        this.tree = {};
        this._ctxMenu = new ExplorerContextMenu();

        on("project:changed", () => this.mount());
        on("project:cleared", () => { this.root.innerHTML = ""; });
        on("explorer:refresh", () => this.mount());
        on("file:create:at",  (p) => this._inlineCreate(p, "file"));
        on("folder:create:at",(p) => this._inlineCreate(p, "folder"));
        on("file:rename",     (p) => this._inlineRename(p));
    }

    async mount() {
        if (!hasProject()) { this.root.innerHTML = ""; return; }

        // Use list-with-dirs so empty folders appear
        const entries = await listFilesWithDirs();
        const git     = await getStatus();
        this.tree     = this.buildTree(entries);

        this.root.innerHTML = "";
        this.root.appendChild(this.createToolbar());
        this.renderNode(this.tree, this.root, "", git, 0);

        // Panel-level context menu (Task 2.3) — right-click on empty area
        this.root.addEventListener("contextmenu", (e) => {
            // Only fire if the click landed directly on the root, not a row
            // (rows stop propagation themselves, but this is the fallback)
            if (e.target === this.root || e.target.closest(".explorer-toolbar")) return;
            if (e.target.closest(".explorer-row")) return;
            e.preventDefault();
            e.stopPropagation();
            this._ctxMenu.show(e.clientX, e.clientY, "", false, false);
        });

        // Also catch contextmenu on the sidebar-body wrapper (parent of this.root)
        const sidebarBody = this.root.closest(".sidebar-body");
        if (sidebarBody && !sidebarBody._hoverCtxBound) {
            sidebarBody._hoverCtxBound = true;
            sidebarBody.addEventListener("contextmenu", (e) => {
                if (e.target.closest(".explorer-row")) return;
                e.preventDefault();
                e.stopPropagation();
                this._ctxMenu.show(e.clientX, e.clientY, "", false, false);
            });
        }
    }

    createToolbar() {
        const bar = this.create("div", "explorer-toolbar");
        const btn = (title, svg, action) => {
            const b = this.create("button", "explorer-toolbar-btn");
            b.title = title;
            b.innerHTML = svg;
            b.onclick = action;
            return b;
        };
        bar.appendChild(btn("New file",
            `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10 5H7V2H5v3H2v2h3v3h2V7h3V5z"/></svg>`,
            () => this._inlineCreate("", "file")
        ));
        bar.appendChild(btn("New folder",
            `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M.54 3.87L.5 3a2 2 0 012-2h3.19a2 2 0 011.28.46l.38.34a1 1 0 00.638.2H14a2 2 0 012 2v2h-2V3.5a.5.5 0 00-.5-.5H8.16a2 2 0 01-1.276-.46l-.38-.34a1 1 0 00-.638-.2H2.5a.5.5 0 00-.5.53l.06.87zM2 6h12v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`,
            () => this._inlineCreate("", "folder")
        ));
        bar.appendChild(btn("Refresh",
            `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 105 5h-1.5a3.5 3.5 0 11-3.5-3.5V6l3-3-3-3v2A5 5 0 008 3z"/></svg>`,
            () => emit("explorer:refresh")
        ));
        return bar;
    }

    // Task 2.1: accepts [{ path, isDir }] — builds tree including empty dirs
    buildTree(entries) {
        const root = {};
        entries.forEach(({ path: p, isDir }) => {
            if (p.includes("node_modules"))  return;
            if (p.includes(".hoverscripts")) return;
            p = p.replaceAll("\\", "/").replaceAll("//", "/");
            const parts = p.split("/").filter(Boolean);
            let node = root;
            parts.forEach((part, i) => {
                if (!node[part]) {
                    // Mark as empty folder if this is the last segment and isDir
                    node[part] = (i === parts.length - 1 && isDir) ? { __empty: true } : {};
                }
                node = node[part];
            });
        });
        return root;
    }

    isLeaf(node) {
        const keys = Object.keys(node);
        // Pure empty dir placeholder: { __empty: true }
        if (keys.length === 1 && keys[0] === "__empty") return false;
        return keys.length === 0;
    }

    isEmptyDir(node) {
        const keys = Object.keys(node);
        return keys.length === 1 && keys[0] === "__empty";
    }

    renderNode(node, container, prefix, git, depth) {
        const keys = Object.keys(node)
            .filter(k => k !== "__empty")
            .sort((a, b) => {
                const aLeaf = this.isLeaf(node[a]);
                const bLeaf = this.isLeaf(node[b]);
                if (aLeaf !== bLeaf) return aLeaf ? 1 : -1;
                return a.localeCompare(b);
            });

        keys.forEach(key => {
            const fullPath = prefix ? `${prefix}/${key}` : key;
            const leaf     = this.isLeaf(node[key]);
            const emptyDir = this.isEmptyDir(node[key]);

            const row = this.create("div", "explorer-row");

            for (let i = 0; i < depth; i++) {
                row.appendChild(this.create("span", "explorer-indent"));
            }

            const toggle = this.create("span",
                (leaf) ? "explorer-toggle explorer-toggle--leaf" : "explorer-toggle"
            );
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
            delBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1h3a.5.5 0 01.5.5v1H6v-1a.5.5 0 01.5-.5zM11 2.5v-1A1.5 1.5 0 009.5 0h-3A1.5 1.5 0 005 1.5v1H2.506a.58.58 0 00-.01 0H1.5a.5.5 0 000 1h.538l.853 10.66A2 2 0 004.885 16h6.23a2 2 0 001.994-1.84l.853-10.66h.538a.5.5 0 000-1h-.995a.59.59 0 00-.01 0H11z"/></svg>`;
            delBtn.onclick = (e) => { e.stopPropagation(); emit("file:delete", fullPath); };
            row.appendChild(delBtn);

            row.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._ctxMenu.show(e.clientX, e.clientY, fullPath, leaf, !leaf);
            });

            container.appendChild(row);

            if (!leaf) {
                const children = this.create("div", "explorer-children");
                children.style.display = "none";
                container.appendChild(children);

                if (!emptyDir) {
                    this.renderNode(node[key], children, fullPath, git, depth + 1);
                }

                const toggleChildren = () => {
                    const open = children.style.display === "none";
                    children.style.display = open ? "block" : "none";
                    toggle.classList.toggle("explorer-toggle--open", open);
                    icon.textContent = open ? "📂" : "📁";
                };

                toggle.onclick = (e) => { e.stopPropagation(); toggleChildren(); };
                label.onclick  = (e) => { e.stopPropagation(); toggleChildren(); };
            } else {
                label.onclick = (e) => { e.stopPropagation(); emit("file:open", fullPath); };
            }
        });
    }

    // Task 2.2 — inline rename
    _inlineRename(targetPath) {
        const allLabels = this.root.querySelectorAll(".explorer-label");
        let found = null;
        allLabels.forEach(el => { if (el.title === targetPath) found = el; });
        if (!found) return;

        const currentName = found.textContent;
        const input = this.create("input", "explorer-inline-input");
        input.value = currentName;
        input.style.width = "100%";

        // Swap label → input in the row
        found.replaceWith(input);
        input.select();

        let committed = false;

        const commit = async () => {
            if (committed) return;
            committed = true;
            const newName = input.value.trim();
            // Restore label regardless
            input.replaceWith(found);
            if (!newName || newName === currentName) return;
            const parts   = targetPath.replace(/\\/g, "/").split("/");
            parts[parts.length - 1] = newName;
            const newPath = parts.join("/");
            await renameFile(targetPath, newPath);
            emit("explorer:refresh");
        };

        input.onblur   = commit;
        input.onkeydown = (e) => {
            if (e.key === "Enter")  { e.preventDefault(); commit(); }
            if (e.key === "Escape") { input.replaceWith(found); }
        };
    }

    _inlineCreate(parentPath, type) {
        const allRows = this.root.querySelectorAll(".explorer-row");
        let targetContainer = this.root;

        if (parentPath) {
            allRows.forEach(row => {
                if (row.querySelector(".explorer-label")?.title === parentPath) {
                    const sib = row.nextElementSibling;
                    if (sib?.classList.contains("explorer-children")) {
                        targetContainer = sib;
                        sib.style.display = "block";
                    }
                }
            });
        }

        const row   = this.create("div", "explorer-row");
        const icon  = this.create("span", "explorer-icon");
        icon.textContent = type === "folder" ? "📁" : "📄";
        const input = this.create("input", "explorer-inline-input");
        input.placeholder = type === "folder" ? "folder-name" : "filename.js";

        row.appendChild(icon);
        row.appendChild(input);
        targetContainer.insertBefore(row, targetContainer.firstChild);
        input.focus();

        let committed = false;

        const commit = async () => {
            if (committed) return;
            committed = true;
            const name = input.value.trim();
            row.remove();
            if (!name) return;
            const full = parentPath ? `${parentPath}/${name}` : name;
            if (type === "folder") await createFolder(full);
            else                   await createFile(full);
            emit("explorer:refresh");
        };

        input.onblur   = commit;
        input.onkeydown = (e) => {
            if (e.key === "Enter")  commit();
            if (e.key === "Escape") row.remove();
        };
    }

    getColor(path, git) {
        return git.some(e => path.includes(e.file)) ? "#e2c08d" : "#73c991";
    }
}