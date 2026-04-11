import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";

export default class IDESettingsModal {

    open() {
        const settings = getIDESettings();

        this._win = new ModalWindow({ title: "HoverIDE settings", width: 380 });
        this._win.render();

        const body = document.createElement("div");

        // Auto-comment checkbox
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        autoRow.style.marginBottom = "12px";
        const autoId = "settings-auto-" + Date.now();
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}" ${settings.autoComment ? "checked" : ""}>
            <label for="${autoId}">Auto-comment commits — don't show commit dialog</label>`;
        body.appendChild(autoRow);

        // Local-to-remote commit text
        const localField = this._field(
            "Default commit message (local → remote)",
            settings.localToRemoteCommitText,
            "feat: describe your change..."
        );
        body.appendChild(localField.el);

        // Merge commit text
        const mergeField = this._field(
            "Default merge commit message",
            settings.mergeCommitText,
            "Merge branch 'sandbox' into main"
        );
        body.appendChild(mergeField.el);

        this._win.setContent(body);
        this._win.addFooterBtn("Cancel", "mw-btn--ghost", () => this._win.close());
        this._win.addFooterBtn("Save", "mw-btn--primary", () => {
            updateIDESettings({
                autoComment:             body.querySelector(`#${autoId}`).checked,
                localToRemoteCommitText: localField.input.value,
                mergeCommitText:         mergeField.input.value,
            });
            this._win.close();
        });

        this._win.show();
    }

    _field(label, value, placeholder) {
        const el = document.createElement("div");
        el.className = "mw-field";
        el.innerHTML = `<div class="mw-field-label">${label}</div>`;
        const input = document.createElement("textarea");
        input.className = "mw-textarea";
        input.value = value || "";
        input.placeholder = placeholder;
        input.style.minHeight = "36px";
        el.appendChild(input);
        return { el, input };
    }
}