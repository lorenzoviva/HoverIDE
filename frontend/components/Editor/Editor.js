import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";
import { sendToParent, listenFromParent } from "../../services/Bridge.js";
import { writeFile, createFile, deleteFile } from "../../services/FileService.js";
import { getLanguageFromPath } from "../../services/LanguageService.js";

const AUTOSAVE_DELAY = 800;
const SCRIPT_PREFIX  = ".hoverscripts/";

// Extensions treated as media (shown inline, never opened in Monaco)
const IMAGE_EXTS  = new Set(["png","jpg","jpeg","gif","webp","svg","bmp","ico"]);
const VIDEO_EXTS  = new Set(["mp4","webm","ogg","mov"]);
// Binary types we refuse to open
const BINARY_EXTS = new Set(["exe","dll","bin","zip","tar","gz","7z","rar","pdf","wasm","node"]);

function ext(path) {
    return path?.split(".").pop()?.toLowerCase() ?? "";
}

export default class Editor extends Component {

    constructor(root) {
        super(root);
        this.editor   = null;
        this.currentPath = null;
        this.isApplyingRemoteUpdate = false;
        this._autosaveTimer = null;
        this._dirty   = false;
        this._mode    = "code"; // "code" | "script" | "media" | "blocked"
    }

    async mount() {
        await this.loadMonaco();
        window.require.config({ paths: { vs: "/monaco/vs" } });

        window.require(["vs/editor/editor.main"], () => {
            this.editor = monaco.editor.create(this.root, {
                value: "",
                language: "javascript",
                theme: "vs-dark",
                automaticLayout: true,
            });

            this.editor.onDidChangeModelContent(() => {
                if (!this.currentPath || this.isApplyingRemoteUpdate) return;
                this._dirty = true;
                clearTimeout(this._autosaveTimer);
                this._autosaveTimer = setTimeout(() => this._writeFile(), AUTOSAVE_DELAY);
            });

            on("editor:save",        () => this._onSave());
            on("editor:save-script", () => this._onSaveScript());

            on("file:create", async () => {
                const p = prompt("New file path (e.g. frontend/new.js)");
                if (!p) return;
                await createFile(p);
                emit("explorer:refresh");
                emit("file:open", p);
            });

            on("file:delete", async (p) => {
                await deleteFile(p);
                if (p === this.currentPath) { this._clear(); emit("editor:clear"); }
                emit("explorer:refresh");
            });
        });

        on("file:open", (p) => this.openFile(p));

        listenFromParent((msg) => {
            if ((msg.type === "DOM_MUTATION" || msg.type === "DOM_RESPONSE")
                    && this.currentPath?.endsWith(".html")) {
                this.isApplyingRemoteUpdate = true;
                this.editor.setValue(msg.content);
                this.isApplyingRemoteUpdate = false;
            }
        });
    }

    async openFile(path) {
        if (!path) { this._clear(); return; }

        // Flush pending write for previous file
        clearTimeout(this._autosaveTimer);
        if (this._dirty && this._mode === "code") await this._writeFile();
        if (this._dirty && this._mode === "script") await this._onSaveScript();

        this.currentPath = path;
        this._dirty      = false;

        const e = ext(path);

        // ── Media files ──────────────────────────────────
        if (IMAGE_EXTS.has(e) || VIDEO_EXTS.has(e)) {
            this._mode = "media";
            this._showMedia(path, IMAGE_EXTS.has(e) ? "image" : "video");
            return;
        }

        // ── Binary (unsupported) ──────────────────────────
        if (BINARY_EXTS.has(e)) {
            this._mode = "blocked";
            this._showBlocked(path);
            return;
        }

        // ── HoverScript ───────────────────────────────────
        if (path.startsWith(SCRIPT_PREFIX)) {
            this._mode = "script";
            this._showMonaco();
            await this._openScript(path);
            return;
        }

        // ── Regular project file ──────────────────────────
        this._mode = "code";
        this._showMonaco();

        if (path.endsWith(".html")) {
            sendToParent({ type: "GET_DOM" });
            return;
        }

        const res = await fetch(`/api/file/read?path=${encodeURIComponent(path)}`);
        const content  = await res.text();
        const language = getLanguageFromPath(path);

        this.isApplyingRemoteUpdate = true;
        this.editor.setValue(content);
        const model = this.editor.getModel();
        if (model) monaco.editor.setModelLanguage(model, language);
        this.isApplyingRemoteUpdate = false;
    }

    async _openScript(path) {
        const name = path.replace(SCRIPT_PREFIX, "");
        const res  = await fetch(`/api/scripts/read/${encodeURIComponent(name)}`);
        if (!res.ok) { this._showBlocked(path, "Script not found"); return; }
        const content = await res.text();

        this.isApplyingRemoteUpdate = true;
        this.editor.setValue(content);
        const model = this.editor.getModel();
        if (model) monaco.editor.setModelLanguage(model, "javascript");
        this.isApplyingRemoteUpdate = false;
    }

    _showMonaco() {
        this.root.innerHTML = "";
        // Re-add editor container — Monaco auto-layouts into it
        if (!this.root.contains(this.editor?.getDomNode())) {
            this.root.appendChild(this.editor.getDomNode());
        }
        this.editor.layout();
    }

    _showMedia(path, type) {
        this.root.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;background:#1a1a1a";

        if (type === "image") {
            const img = document.createElement("img");
            img.src = `/api/file/raw?path=${encodeURIComponent(path)}`;
            img.style.cssText = "max-width:90%;max-height:80%;object-fit:contain;border-radius:4px";
            img.onerror = () => { img.replaceWith(this._makeErrorMsg("Could not load image")); };
            wrap.appendChild(img);
        } else {
            const video = document.createElement("video");
            video.src = `/api/file/raw?path=${encodeURIComponent(path)}`;
            video.controls = true;
            video.style.cssText = "max-width:90%;max-height:80%;border-radius:4px";
            wrap.appendChild(video);
        }

        const caption = document.createElement("div");
        caption.style.cssText = "font-size:11px;color:#555;font-family:monospace";
        caption.textContent = path;
        wrap.appendChild(caption);

        this.root.appendChild(wrap);
    }

    _showBlocked(path, reason) {
        this.root.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px";
        const icon = document.createElement("div");
        icon.style.cssText = "font-size:32px;opacity:.3";
        icon.textContent = "🚫";
        const msg = document.createElement("div");
        msg.style.cssText = "font-size:12px;color:#666;font-family:monospace";
        msg.textContent = reason || `Binary file — cannot open ${path.split("/").pop()}`;
        wrap.appendChild(icon);
        wrap.appendChild(msg);
        this.root.appendChild(wrap);
    }

    _makeErrorMsg(text) {
        const d = document.createElement("div");
        d.style.cssText = "font-size:11px;color:#f48771";
        d.textContent = text;
        return d;
    }

    _clear() {
        this.currentPath = null;
        this._dirty = false;
        this._mode  = "code";
        this._showMonaco();
        this.editor?.setValue("");
    }

    async _writeFile() {
        if (!this.currentPath || !this.editor || this._mode !== "code") return;
        if (this.currentPath.includes("backend")) return;
        await writeFile(this.currentPath, this.editor.getValue());
        this._dirty = false;
        emit("file:written", this.currentPath);
    }

    async _onSaveScript() {
        if (!this.currentPath || this._mode !== "script") return;
        const name    = this.currentPath.replace(SCRIPT_PREFIX, "");
        const content = this.editor.getValue();
        await fetch("/api/scripts/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content }),
        });
        this._dirty = false;
        emit("file:saved", this.currentPath);
    }

    async _onSave() {
        if (this._mode === "script") { await this._onSaveScript(); return; }
        if (this._mode !== "code")   return;
        if (!this.currentPath)        return;

        if (this.currentPath.includes("backend")) {
            const ok = confirm("Saving backend file will restart server. Continue?");
            if (!ok) return;
        }

        clearTimeout(this._autosaveTimer);
        await this._writeFile();

        const { default: CommitModal } = await import("../modals/CommitModal.js");
        new CommitModal().open({
            files: [this.currentPath],
            onCommit: async ({ message }) => {
                const res = await fetch("/api/vcs/commit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message }),
                });
                if (!res.ok) { alert(`Commit failed: ${(await res.json()).error}`); return; }
                emit("file:saved", this.currentPath);
                emit("explorer:refresh");
            },
        });
    }

    loadMonaco() {
        return new Promise((resolve) => {
            if (window.require) return resolve();
            const script = document.createElement("script");
            script.src = "/monaco/vs/loader.js";
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }
}