import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";

export default class EditorBar extends Component {

    mount() {
        this.root.className = "editor-bar";

        this.pathEl = this.create("span", "editor-bar-path");
        this.pathEl.textContent = "No file open";

        // Mass commit button — always visible
        const commitAllBtn = this.create("button", "editor-bar-btn");
        commitAllBtn.textContent = "Commit…";
        commitAllBtn.title = "Commit multiple files";
        commitAllBtn.onclick = () => emit("vcs:mass-commit");

        // Save button — only active when a file is open
        const saveBtn = this.create("button", "editor-bar-btn editor-bar-btn--save");
        saveBtn.textContent = "Save";
        saveBtn.title = "Write + commit current file";
        saveBtn.onclick = () => emit("editor:save");

        this.root.appendChild(this.pathEl);
        this.root.appendChild(commitAllBtn);
        this.root.appendChild(saveBtn);

        on("file:open", (path) => {
            const parts = path.split("/");
            const file  = parts.pop();
            const dir   = parts.join("/");
            this.pathEl.innerHTML = dir
                ? `<span class="editor-bar-path-dir">${dir}/</span><span class="editor-bar-path-file">${file}</span>`
                : `<span class="editor-bar-path-file">${file}</span>`;
            saveBtn.disabled = false;
        });

        on("editor:clear", () => {
            this.pathEl.textContent = "No file open";
            saveBtn.disabled = true;
        });

        on("file:written", () => {
            // Brief visual feedback — dot on path
            this.pathEl.title = "Unsaved changes";
        });

        on("file:saved", () => {
            this.pathEl.title = "";
        });

        saveBtn.disabled = true;
    }
}