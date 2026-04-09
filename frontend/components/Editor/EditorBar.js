import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";

export default class EditorBar extends Component {

    mount() {
        this.root.className = "editor-bar";

        this.pathEl = this.create("span", "editor-bar-path");
        this.pathEl.textContent = "No file open";

        const saveBtn = this.create("button", "editor-bar-btn");
        saveBtn.textContent = "Save";
        saveBtn.onclick = () => emit("editor:save");

        this.root.appendChild(this.pathEl);
        this.root.appendChild(saveBtn);

        on("file:open", (path) => {
            const parts = path.split("/");
            const file  = parts.pop();
            const dir   = parts.join("/");

            this.pathEl.innerHTML = dir
                ? `<span class="editor-bar-path-dir">${dir}/</span><span class="editor-bar-path-file">${file}</span>`
                : `<span class="editor-bar-path-file">${file}</span>`;
        });

        on("editor:clear", () => {
            this.pathEl.innerHTML = "";
        });
    }
}