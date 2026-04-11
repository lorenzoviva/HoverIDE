import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";
import { vcsCommit } from "../../services/FileService.js";

export default class CommitModal {

    open({ files = [], onCommit } = {}) {
        const settings = getIDESettings();

        if (settings.autoComment) {
            const msg = settings.localToRemoteCommitText || "auto";
            onCommit?.({ message: msg, mergeMessage: msg, files });
            return;
        }

        // Fresh state — no shared references
        let stagedFiles = [...files];

        const win = new ModalWindow({ title: "Commit changes", width: 360 });
        win.render();

        const body = document.createElement("div");

        // Staged bar
        const stagedBar = document.createElement("div");
        stagedBar.className = "mw-staged-bar";
        const stagedCount = document.createElement("span");
        stagedCount.style.color = "#4fc1ff";
        const changeLink = document.createElement("span");
        changeLink.className = "mw-link";
        changeLink.textContent = "Change";
        stagedBar.appendChild(stagedCount);
        stagedBar.appendChild(changeLink);
        body.appendChild(stagedBar);

        const updateCount = () => {
            stagedCount.textContent = `${stagedFiles.length} file${stagedFiles.length !== 1 ? "s" : ""} staged`;
        };
        updateCount();

        changeLink.onclick = async () => {
            const { default: FilePicker } = await import("../../core/FilePicker.js");
            const picker = new FilePicker({ mode: "file", multi: true, root: "/" });
            const result = await picker.open();
            if (result) { stagedFiles = result; updateCount(); }
        };

        // Commit message
        const msgLabel = document.createElement("div");
        msgLabel.className = "mw-field-label";
        msgLabel.style.marginBottom = "4px";
        msgLabel.textContent = "Commit message";
        body.appendChild(msgLabel);

        const msgInput = document.createElement("textarea");
        msgInput.className = "mw-textarea";
        msgInput.placeholder = settings.localToRemoteCommitText || "feat: describe your change...";
        body.appendChild(msgInput);

        // Auto-comment checkbox
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        const autoId = `commit-auto-${Date.now()}`;
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}">
            <label for="${autoId}">Auto-comment — don't ask again</label>`;
        body.appendChild(autoRow);
        autoRow.querySelector("input").onchange = (e) => {
            updateIDESettings({ autoComment: e.target.checked });
        };

        // Same-message checkbox
        const mergeRow = document.createElement("div");
        mergeRow.className = "mw-check-row";
        const mergeId = `commit-merge-${Date.now()}`;
        mergeRow.innerHTML = `<input type="checkbox" id="${mergeId}" checked>
            <label for="${mergeId}">Same message for merge commit</label>`;
        body.appendChild(mergeRow);
        const mergeCb = mergeRow.querySelector("input");

        // Merge message field
        const mergeWrap = document.createElement("div");
        mergeWrap.style.cssText = "opacity:.3;pointer-events:none;transition:opacity .15s";
        const mergeLabel = document.createElement("div");
        mergeLabel.className = "mw-field-label";
        mergeLabel.style.marginBottom = "4px";
        mergeLabel.textContent = "Merge commit message";
        const mergeInput = document.createElement("textarea");
        mergeInput.className = "mw-textarea";
        mergeInput.placeholder = settings.mergeCommitText || "Merge branch 'sandbox' into main";
        mergeInput.disabled = true;
        mergeWrap.appendChild(mergeLabel);
        mergeWrap.appendChild(mergeInput);
        body.appendChild(mergeWrap);

        mergeCb.onchange = () => {
            const on = mergeCb.checked;
            mergeWrap.style.opacity = on ? ".3" : "1";
            mergeWrap.style.pointerEvents = on ? "none" : "auto";
            mergeInput.disabled = on;
        };

        win.setContent(body);
        win.addFooterBtn("Cancel", "mw-btn--ghost", () => win.close());
        win.addFooterBtn("Commit", "mw-btn--primary", async () => {
            const message      = msgInput.value.trim()   || msgInput.placeholder;
            const mergeMessage = mergeCb.checked ? message : (mergeInput.value.trim() || mergeInput.placeholder);
            win.close();
            await onCommit?.({ message, mergeMessage, files: stagedFiles });
        });

        win.show();
    }
}