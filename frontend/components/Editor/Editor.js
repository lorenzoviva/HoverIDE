import Component from "../../core/Component.js";
import { send as sendState } from "../../services/StateService.js";
import { on, emit } from "../../core/EventBus.js";
import { sendToParent, listenFromParent } from "../../services/Bridge.js";
import { writeFile, createFile } from "../../services/FileService.js";

export default class Editor extends Component {

    constructor(root) {
        super(root);

        this.editor = null;
        this.currentPath = null;
        this.isApplyingRemoteUpdate = false;
    }

    async mount() {

        // Init Monaco
        await this.loadMonaco();

          window.require.config({
            paths: { vs: "/monaco/vs" }
          });

          window.require(["vs/editor/editor.main"], () => {

            this.editor = monaco.editor.create(this.root, {
              value: '',
              language: 'javascript',
              theme: 'vs-dark',
              automaticLayout: true
            });

            on("editor:save", async () => {
                if (!this.currentPath) return;

                  // ⚠️ Backend confirmation
                if (this.currentPath.includes("backend")) {
                    const confirmSave = confirm("Saving backend file will restart server. Continue?");
                    if (!confirmSave) return;
                }

              await writeFile(this.currentPath, this.editor.getValue());

              emit("file:saved", this.currentPath);
            });
            on("file:create", async () => {

              const path = prompt("Enter new file path (e.g. frontend/new.js)");
              if (!path) return;

              await createFile(path);

              emit("explorer:refresh");
              emit("file:open", path);
            });

            // Track local edits
            this.editor.onDidChangeModelContent(() => {
                if (!this.currentPath || this.isApplyingRemoteUpdate) return;

                const content = this.editor.getValue();

                // Save to extension (VCS working state)
//                 sendState({
//                     type: "TRACK_EDIT",
//                     path: this.currentPath,
//                     content
//                 });
            });

        });

        // Listen to file open
        on("file:open", (path) => this.openFile(path));

        // Listen to parent DOM updates (DevTools edits)
        listenFromParent((msg) => {
            if (msg.type === "DOM_MUTATION" && this.currentPath?.endsWith(".html")) {

                this.isApplyingRemoteUpdate = true;

                this.editor.setValue(msg.content);

                this.isApplyingRemoteUpdate = false;
            }

            if (msg.type === "DOM_RESPONSE" && this.currentPath?.endsWith(".html")) {

                this.isApplyingRemoteUpdate = true;

                this.editor.setValue(msg.content);

                this.isApplyingRemoteUpdate = false;
            }
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
    /**
     * Open file
     */
    async openFile(path) {
        this.currentPath = path;

        // HTML files → source from live DOM
        if (path.endsWith(".html")) {
            sendToParent({ type: "GET_DOM" });
            return;
        }

        // Non-HTML → use backend + extension
//         const res = await fetch(`/api/file/read?projectName=${}&path=${path}`);
        const res = await fetch(`/api/file/read?path=${path}`);
        const original = await res.text();

//         const local = await sendState({ type: "GET_FILE", path });

//         this.editor.setValue(local?.content || original);
        this.editor.setValue(original);
    }

    /**
     * Apply editor content to live DOM
     */
    applyToDOM() {
        if (!this.currentPath?.endsWith(".html")) return;

        const content = this.editor.getValue();

        sendToParent({
            type: "SET_DOM",
            content
        });
    }

}