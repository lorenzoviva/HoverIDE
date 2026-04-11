import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings } from "../../core/IDESettings.js";

export default class CommitModal {

    // files: string[] — pre-staged list (can be overridden by user)
    // onCommit: ({ message, mergeMessage, files }) => void
    open({ files = [], onCommit } = {}) {
        const settings = getIDESettings();

        // If auto-comment is on, skip the whole modal
        if (settings.autoComment) {
            const msg = settings.localToRemoteCommitText || "auto: save";
            onCommit?.({ message: msg, mergeMessage: msg, files });
            return;
        }

        this._win = new ModalWindow({ title: "Commit changes", width: 360 });
        this._win.render();

        const body = document.createElement("div");

        // Staged count + change link
        const staged = document.createElement("div");
        staged.className = "mw-staged-bar";
        staged.innerHTML = `<span id="staged-count" style="color:#4fc1ff">${files.length} file${files.length !== 1 ? "s" : ""} staged</span>
            <span class="mw-link" id="change-staged">Change</span>`;
        body.appendChild(staged);

        // Commit message
        const msgLabel = document.createElement("div");
        msgLabel.className = "mw-field-label";
        msgLabel.textContent = "Commit message";
        msgLabel.style.marginBottom = "4px";
        body.appendChild(msgLabel);

        const msgInput = document.createElement("textarea");
        msgInput.className = "mw-textarea";
        msgInput.placeholder = settings.localToRemoteCommitText || "feat: describe your change...";
        body.appendChild(msgInput);

        // Checkbox: auto-comment
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        const autoId = "commit-auto-" + Date.now();
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}">
            <label for="${autoId}">Auto-comment — don't ask again</label>`;
        body.appendChild(autoRow);
        const autoCb = autoRow.querySelector("input");
        autoCb.onchange = () => {
            import("../../core/IDESettings.js").then(({ updateIDESettings }) => {
                updateIDESettings({ autoComment: autoCb.checked });
            });
        };

        // Checkbox: same message for merge
        const mergeRow = document.createElement("div");
        mergeRow.className = "mw-check-row";
        const mergeId = "commit-merge-" + Date.now();
        mergeRow.innerHTML = `<input type="checkbox" id="${mergeId}" checked>
            <label for="${mergeId}">Same message for merge commit</label>`;
        body.appendChild(mergeRow);
        const mergeCb = mergeRow.querySelector("input");

        // Merge message field (hidden when checkbox is on)
        const mergeField = document.createElement("div");
        mergeField.className = "mw-field";
        mergeField.style.cssText = "opacity:0.3;pointer-events:none;transition:opacity .15s";
        mergeField.innerHTML = `<div class="mw-field-label">Merge commit message</div>`;
        const mergeInput = document.createElement("textarea");
        mergeInput.className = "mw-textarea";
        mergeInput.placeholder = settings.mergeCommitText || "Merge branch 'sandbox' into main";
        mergeInput.disabled = true;
        mergeField.appendChild(mergeInput);
        body.appendChild(mergeField);

        mergeCb.onchange = () => {
            const on = mergeCb.checked;
            mergeField.style.opacity = on ? "0.3" : "1";
            mergeField.style.pointerEvents = on ? "none" : "auto";
            mergeInput.disabled = on;
        };

        // Change staged files
        document.getElementById("change-staged")?.addEventListener("click", async () => {
            const { default: FilePicker } = await import("../../core/FilePicker.js");
            const picker = new FilePicker({ mode: "file", multi: true, root: "/" });
            const result = await picker.open();
            if (result) {
                files = result;
                document.getElementById("staged-count").textContent =
                    `${files.length} file${files.length !== 1 ? "s" : ""} staged`;
            }
        });

        this._win.setContent(body);
        this._win.addFooterBtn("Cancel", "mw-btn--ghost", () => this._win.close());
        this._win.addFooterBtn("Commit", "mw-btn--primary", () => {
            const message = msgInput.value.trim() || msgInput.placeholder;
            const mergeMessage = mergeCb.checked ? message : (mergeInput.value.trim() || mergeInput.placeholder);
            onCommit?.({ message, mergeMessage, files });
            this._win.close();
        });

        this._win.show();
    }
}