import ModalWindow from "./ModalWindow.js";

// mode: "file" | "folder" | "both"
// multi: false | true
// Returns Promise<string | string[] | null>

export default class FilePicker {

    constructor({ mode = "both", multi = false, title, root = "/" } = {}) {
        this.mode  = mode;   // what's selectable
        this.multi = multi;
        this.title = title || (multi ? "Select files" : mode === "folder" ? "Choose folder" : "Choose file");
        this.root  = root;   // starting path passed to backend
    }

    // Returns a Promise that resolves with the selection or null on cancel
    open() {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._selected = new Set();
            this._cwd = this.root;

            this._win = new ModalWindow({ title: this.title, width: 380 });
            this._win.render();
            this._win.onClose = () => resolve(null);

            this._buildBody();
            this._win.show();
        });
    }

    _buildBody() {
        const body = document.createElement("div");

        // Breadcrumb
        this._crumbEl = document.createElement("div");
        this._crumbEl.className = "fp-crumb";
        body.appendChild(this._crumbEl);

        // Selection count (multi only)
        if (this.multi) {
            this._countEl = document.createElement("div");
            this._countEl.className = "fp-count";
            body.appendChild(this._countEl);
        }

        // Tree
        this._treeEl = document.createElement("div");
        this._treeEl.className = "fp-tree";
        body.appendChild(this._treeEl);

        // Single-select hint
        if (!this.multi) {
            const hint = document.createElement("div");
            hint.className = "fp-hint";
            hint.textContent = this.mode === "folder" ? "Double-click to navigate into folder" : "Click to select";
            body.appendChild(hint);
        } else {
            const hint = document.createElement("div");
            hint.className = "fp-hint";
            hint.textContent = "Check items to select";
            body.appendChild(hint);
        }

        this._win.setContent(body);

        // Footer
        this._win.footer.innerHTML = "";
        this._win.addFooterBtn("Cancel", "mw-btn--ghost", () => {
            this._win.close();
            this._resolve(null);
        });

        this._confirmBtn = this._win.addFooterBtn(
            this.multi ? "Select (0)" : (this.mode === "folder" ? "Select folder" : "Select"),
            "mw-btn--primary",
            () => this._confirm()
        );

        this._loadDir(this.root);
    }

    async _loadDir(path) {
        this._cwd = path;
        this._updateCrumb();

        // Ask backend for directory listing
        let entries = [];
        try {
            const res = await fetch(`/api/file/ls?path=${encodeURIComponent(path)}`);
            entries = await res.json(); // [{ name, path, isDir }]
        } catch {
            entries = [];
        }

        this._treeEl.innerHTML = "";

        // Add ".." to go up unless already at root
        if (path !== this.root && path !== "/") {
            const up = this._makeRow({ name: "..", path: this._parentOf(path), isDir: true }, true);
            this._treeEl.appendChild(up);
        }

        entries.forEach(entry => {
            // Filter by mode: in "file" mode hide folders from selection but still show for navigation
            const row = this._makeRow(entry, false);
            this._treeEl.appendChild(row);
        });

        this._updateCount();
    }

    _makeRow(entry, isUp) {
        const row = document.createElement("div");
        row.className = "fp-row";

        if (this.multi && !isUp) {
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "fp-cb";

            // Only allow selecting what mode permits
            const selectable = this.mode === "both"
                ? true
                : this.mode === "folder" ? entry.isDir
                : !entry.isDir;

            if (!selectable) {
                cb.disabled = true;
                cb.style.opacity = "0.2";
            }

            cb.checked = this._selected.has(entry.path);
            cb.onchange = () => {
                if (cb.checked) this._selected.add(entry.path);
                else this._selected.delete(entry.path);
                // If folder checked in multi mode, check/uncheck children handled server-side on confirm
                this._updateCount();
            };
            row.appendChild(cb);
        }

        const icon = document.createElement("span");
        icon.className = "fp-icon";
        icon.textContent = entry.isDir ? "📁" : "📄";
        row.appendChild(icon);

        const name = document.createElement("span");
        name.className = "fp-name";
        name.textContent = isUp ? ".. (up)" : entry.name;
        row.appendChild(name);

        if (!this.multi) {
            // Single mode: click selects, double-click navigates into folder
            row.onclick = () => {
                if (isUp || (entry.isDir && this.mode === "file")) {
                    return; // navigate on dblclick only
                }
                const selectable = this.mode === "both"
                    ? true
                    : this.mode === "folder" ? entry.isDir
                    : !entry.isDir;

                if (selectable) {
                    this._treeEl.querySelectorAll(".fp-row").forEach(r => r.classList.remove("fp-row--selected"));
                    row.classList.add("fp-row--selected");
                    this._singleSelected = entry.path;
                    this._updateCount();
                }
            };
            row.ondblclick = () => {
                if (entry.isDir) this._loadDir(entry.path);
            };
        } else {
            // In multi mode, clicking a folder navigates; checking selects
            if (entry.isDir) {
                name.style.cursor = "pointer";
                name.ondblclick = () => this._loadDir(entry.path);
            }
        }

        return row;
    }

    _confirm() {
        if (this.multi) {
            const result = [...this._selected];
            this._win.close();
            this._resolve(result.length ? result : null);
        } else {
            const result = this._singleSelected || null;
            this._win.close();
            this._resolve(result);
        }
    }

    _updateCrumb() {
        this._crumbEl.innerHTML = "";
        const parts = this._cwd.replace(/\\/g, "/").split("/").filter(Boolean);
        let cumulative = "";
        parts.forEach((part, i) => {
            cumulative += (i === 0 ? "" : "/") + part;
            const crumb = document.createElement("span");
            crumb.className = "fp-crumb-seg";
            crumb.textContent = part;
            const captured = cumulative;
            crumb.onclick = () => this._loadDir(captured);
            this._crumbEl.appendChild(crumb);
            if (i < parts.length - 1) {
                const sep = document.createElement("span");
                sep.className = "fp-crumb-sep";
                sep.textContent = "/";
                this._crumbEl.appendChild(sep);
            }
        });
    }

    _updateCount() {
        if (this.multi) {
            const n = this._selected.size;
            this._countEl.textContent = `${n} selected`;
            this._confirmBtn.textContent = `Select (${n})`;
        } else {
            const has = !!this._singleSelected;
            this._confirmBtn.disabled = !has;
        }
    }

    _parentOf(path) {
        const p = path.replace(/\\/g, "/");
        return p.substring(0, p.lastIndexOf("/")) || this.root;
    }
}