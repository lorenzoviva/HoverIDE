import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";
import { sendToParent, listenFromParent } from "../../services/Bridge.js";
import { writeFile, createFile, deleteFile } from "../../services/FileService.js";
import { getLanguageFromPath } from "../../services/LanguageService.js";

const AUTOSAVE_DELAY = 800; // ms debounce

export default class Editor extends Component {

    constructor(root) {
        super(root);
        this.editor = null;
        this.currentPath = null;
        this.isApplyingRemoteUpdate = false;
        this._autosaveTimer = null;
        this._dirty = false;
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

            // Auto-write (not commit) on every keystroke after debounce
            this.editor.onDidChangeModelContent(() => {
                if (!this.currentPath || this.isApplyingRemoteUpdate) return;
                this._dirty = true;
                clearTimeout(this._autosaveTimer);
                this._autosaveTimer = setTimeout(() => this._writeFile(), AUTOSAVE_DELAY);
            });

            // "Save" = write immediately + open CommitModal
            on("editor:save", () => this._onSave());

            on("file:create", async () => {
                const path = prompt("Enter new file path (e.g. frontend/new.js)");
                if (!path) return;
                await createFile(path);
                emit("explorer:refresh");
                emit("file:open", path);
            });

            on("file:delete", async (path) => {
                await deleteFile(path);
                if (path === this.currentPath) {
                    this.editor.setValue("");
                    this.currentPath = null;
                    emit("editor:clear");
                }
                emit("explorer:refresh");
            });
        });

        on("file:open", (path) => this.openFile(path));

        listenFromParent((msg) => {
            if ((msg.type === "DOM_MUTATION" || msg.type === "DOM_RESPONSE")
                    && this.currentPath?.endsWith(".html")) {
                this.isApplyingRemoteUpdate = true;
                this.editor.setValue(msg.content);
                this.isApplyingRemoteUpdate = false;
            }
        });
    }

    // Write content to disk silently (no commit)
    async _writeFile() {
        if (!this.currentPath || !this.editor) return;
        if (this.currentPath.includes("backend")) return; // backend warns separately
        await writeFile(this.currentPath, this.editor.getValue());
        this._dirty = false;
        emit("file:written", this.currentPath);
    }

    // Save button: flush write then open commit dialog
    async _onSave() {
        if (!this.currentPath) return;

        if (this.currentPath.includes("backend")) {
            const ok = confirm("Saving backend file will restart server. Continue?");
            if (!ok) return;
        }

        // Flush any pending autosave first
        clearTimeout(this._autosaveTimer);
        await this._writeFile();

        // Open commit modal
        const { default: CommitModal } = await import("../modals/CommitModal.js");
        new CommitModal().open({
            files: [this.currentPath],
            onCommit: async ({ message, mergeMessage }) => {
                const res = await fetch("/api/vcs/commit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message, mergeMessage }),
                });
                if (!res.ok) {
                    const { error } = await res.json();
                    alert(`Commit failed: ${error}`);
                    return;
                }
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

    async openFile(path) {
        if (!path) {
            this.editor?.setValue("");
            this.currentPath = null;
            return;
        }

        // Flush any pending write for the previous file
        clearTimeout(this._autosaveTimer);
        if (this._dirty) await this._writeFile();

        this.currentPath = path;
        this._dirty = false;

        if (path.endsWith(".html")) {
            sendToParent({ type: "GET_DOM" });
            return;
        }

        const res = await fetch(`/api/file/read?path=${encodeURIComponent(path)}`);
        const content = await res.text();
        const language = getLanguageFromPath(path);

        this.isApplyingRemoteUpdate = true;
        this.editor.setValue(content);
        const model = this.editor.getModel();
        if (model) monaco.editor.setModelLanguage(model, language);
        this.isApplyingRemoteUpdate = false;
    }
}