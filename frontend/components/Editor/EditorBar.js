import Component from "../../core/Component.js";
import { on, emit } from "../../core/EventBus.js";
import scriptEngine from "../../core/ScriptEngine.js";

const SCRIPT_PREFIX = ".hoverscripts/";

function isScriptPath(path) {
    return path?.startsWith(SCRIPT_PREFIX);
}

function scriptName(path) {
    return path?.replace(SCRIPT_PREFIX, "") ?? "";
}

export default class EditorBar extends Component {

    mount() {
        this.root.className = "editor-bar";
        this._currentPath = null;

        // Path display
        this.pathEl = this.create("span", "editor-bar-path");
        this.pathEl.textContent = "No file open";
        this.root.appendChild(this.pathEl);

        // Script-mode controls (hidden by default)
        this._scriptControls = this.create("div", "editor-bar-script-controls");
        this._scriptControls.style.display = "none";

        const runBtn = this.create("button", "editor-bar-btn editor-bar-btn--run");
        runBtn.innerHTML = `▶ Run`;
        runBtn.title = "Run script";
        runBtn.onclick = () => this._runScript();

        const debugBtn = this.create("button", "editor-bar-btn");
        debugBtn.textContent = "Debug";
        debugBtn.title = "Run with verbose logging";
        debugBtn.onclick = () => this._runScript(true);

        const consoleBtn = this.create("button", "editor-bar-btn");
        consoleBtn.textContent = "Console";
        consoleBtn.title = "Toggle console";
        consoleBtn.onclick = () => emit("script:console:toggle");

        this._scriptControls.appendChild(runBtn);
        this._scriptControls.appendChild(debugBtn);
        this._scriptControls.appendChild(consoleBtn);
        this.root.appendChild(this._scriptControls);

        // Commit button — always visible
        const commitAllBtn = this.create("button", "editor-bar-btn");
        commitAllBtn.textContent = "Commit…";
        commitAllBtn.title = "Commit multiple files";
        commitAllBtn.onclick = () => emit("vcs:mass-commit");
        this.root.appendChild(commitAllBtn);

        // Save button — project files only
        this._saveBtn = this.create("button", "editor-bar-btn editor-bar-btn--save");
        this._saveBtn.textContent = "Save";
        this._saveBtn.title = "Write + commit";
        this._saveBtn.onclick = () => emit("editor:save");
        this._saveBtn.disabled = true;
        this.root.appendChild(this._saveBtn);

        // Script save button (saves to .hoverscripts dir, no commit)
        this._scriptSaveBtn = this.create("button", "editor-bar-btn editor-bar-btn--save");
        this._scriptSaveBtn.textContent = "Save script";
        this._scriptSaveBtn.style.display = "none";
        this._scriptSaveBtn.onclick = () => emit("editor:save-script");
        this.root.appendChild(this._scriptSaveBtn);

        on("file:open", (path) => this._onFileOpen(path));
        on("editor:clear", () => this._onClear());
        on("file:written", () => { this.pathEl.title = "Unsaved"; });
        on("file:saved",   () => { this.pathEl.title = ""; });
    }

    _onFileOpen(path) {
        this._currentPath = path;
        const parts = path.replace(/\\/g, "/").split("/");
        const file  = parts.pop();
        const dir   = parts.join("/");

        this.pathEl.innerHTML = dir
            ? `<span class="editor-bar-path-dir">${dir}/</span><span class="editor-bar-path-file">${file}</span>`
            : `<span class="editor-bar-path-file">${file}</span>`;

        const isScript = isScriptPath(path);

        this._scriptControls.style.display  = isScript ? "flex"  : "none";
        this._scriptSaveBtn.style.display   = isScript ? "inline-block" : "none";
        this._saveBtn.style.display         = isScript ? "none"  : "inline-block";
        this._saveBtn.disabled = false;
    }

    _onClear() {
        this._currentPath = null;
        this.pathEl.textContent = "No file open";
        this._scriptControls.style.display = "none";
        this._scriptSaveBtn.style.display  = "none";
        this._saveBtn.style.display        = "inline-block";
        this._saveBtn.disabled = true;
    }

    async _runScript(debug = false) {
        const name = scriptName(this._currentPath);
        if (!name) return;
        emit("script:console:show");
        emit("script:run", { scriptName: name });
        try {
            await scriptEngine.reload(name);
            if (debug) emit("script:log", { scriptName: name, args: ["Debug mode: script loaded and subscribed to events."] });
        } catch (e) {
            emit("script:error", { scriptName: name, args: [e.message] });
        }
    }
}