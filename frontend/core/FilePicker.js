import ModalWindow from "./ModalWindow.js";
import { lsDir } from "../services/FileService.js";

export default class FilePicker {

    constructor({ mode = "both", multi = false, title, root = "/" } = {}) {
        this.mode  = mode;
        this.multi = multi;
        this.title = title || (multi ? "Select files" : mode === "folder" ? "Choose folder" : "Choose file");
        this.root  = root;
    }

    open() {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._selected = new Set();
            this._singleSelected = null;
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

        this._crumbEl = document.createElement("div");
        this._crumbEl.className = "fp-crumb";
        body.appendChild(this._crumbEl);

        if (this.multi) {
            this._countEl = document.createElement("div");
            this._countEl.className = "fp-count";
            body.appendChild(this._countEl);
        }

        this._treeEl = document.createElement("div");
        this._treeEl.className = "fp-tree";
        body.appendChild(this._treeEl);

        const hint = document.createElement("div");
        hint.className = "fp-hint";
        hint.textContent = this.multi
            ? "Check items to select"
            : this.mode === "folder" ? "Double-click to navigate" : "Click to select";
        body.appendChild(hint);

        this._win.setContent(body);
        this._win.footer.innerHTML = "";

        this._win.addFooterBtn("Cancel", "mw-btn--ghost", () => {
            this._win.close();
            this._resolve(null);
        });

        this._confirmBtn = this._win.addFooterBtn(
            this.multi ? "Select (0)" : this.mode === "folder" ? "Select folder" : "Select",
            "mw-btn--primary",
            () => this._confirm()
        );
        if (!this.multi) this._confirmBtn.disabled = true;

        this._loadDir(this.root);
    }

    async _loadDir(dirPath) {
        this._cwd = dirPath;
        this._updateCrumb();
        this._treeEl.innerHTML = `<div class="fp-row" style="color:#555">Loading…</div>`;

        let entries = [];
        try {
            entries = await lsDir(dirPath);
        } catch {
            entries = [];
        }

        this._treeEl.innerHTML = "";

        if (dirPath !== this.root) {
            this._treeEl.appendChild(
                this._makeRow({ name: "..", path: this._parentOf(dirPath), isDir: true }, true)
            );
        }

        entries.forEach(e => this._treeEl.appendChild(this._makeRow(e, false)));
        this._updateCount();
    }

    _makeRow(entry, isUp) {
        const row = document.createElement("div");
        row.className = "fp-row";

        if (this.multi && !isUp) {
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "fp-cb";
            const selectable = this.mode === "both" ? true
                : this.mode === "folder" ? entry.isDir : !entry.isDir;
            if (!selectable) { cb.disabled = true; cb.style.opacity = "0.2"; }
            cb.checked = this._selected.has(entry.path);
            cb.onchange = () => {
                cb.checked ? this._selected.add(entry.path) : this._selected.delete(entry.path);
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
            row.onclick = () => {
                if (isUp) { this._loadDir(entry.path); return; }
                if (entry.isDir && this.mode === "file") return;
                const selectable = this.mode === "both" ? true
                    : this.mode === "folder" ? entry.isDir : !entry.isDir;
                if (selectable) {
                    this._treeEl.querySelectorAll(".fp-row").forEach(r => r.classList.remove("fp-row--selected"));
                    row.classList.add("fp-row--selected");
                    this._singleSelected = entry.path;
                    this._updateCount();
                }
            };
            row.ondblclick = () => { if (entry.isDir) this._loadDir(entry.path); };
        } else {
            if (entry.isDir) name.ondblclick = () => this._loadDir(entry.path);
        }

        return row;
    }

    _confirm() {
        const result = this.multi ? [...this._selected] : this._singleSelected;
        this._resolve((Array.isArray(result) && !result.length) ? null : result || null);
        this._win.close();
    }

    _updateCrumb() {
        this._crumbEl.innerHTML = "";

        // ROOT node
        const rootSeg = document.createElement("span");
        rootSeg.className = "fp-crumb-seg";
        rootSeg.textContent = "root";
        rootSeg.onclick = () => this._loadDir("/");
        this._crumbEl.appendChild(rootSeg);

        const parts = this._cwd.replace(/\\/g, "/").split("/").filter(Boolean);

        let cum = "";
        parts.forEach((part, i) => {
            cum += (i === 0 ? "" : "/") + part;

            const sep = document.createElement("span");
            sep.className = "fp-crumb-sep";
            sep.textContent = "/";
            this._crumbEl.appendChild(sep);

            const seg = document.createElement("span");
            seg.className = "fp-crumb-seg";
            seg.textContent = part;

            const cap = cum;
            seg.onclick = () => this._loadDir(cap);

            this._crumbEl.appendChild(seg);
        });
    }

    _updateCount() {
        if (this.multi) {
            const n = this._selected.size;
            this._countEl.textContent = `${n} selected`;
            this._confirmBtn.textContent = `Select (${n})`;
        } else {
            this._confirmBtn.disabled = !this._singleSelected;
        }
    }

    _parentOf(p) {
        const s = p.replace(/\\/g, "/");

        // if already at drive root -> go back to "/"
        if (/^[A-Z]:\/?$/i.test(s)) {
            return "/";
        }

        const idx = s.lastIndexOf("/");
        return idx > 0 ? s.substring(0, idx) : this.root;
    }
}