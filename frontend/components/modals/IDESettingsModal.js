import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";
import BrowseField from "../../core/BrowseField.js";

export default class IDESettingsModal {

    open() {
        const settings = getIDESettings();

        this._win = new ModalWindow({ title: "HoverIDE settings", width: 400 });
        this._win.render();

        const body = document.createElement("div");

        // Auto-comment
        const autoId = "settings-auto-" + Date.now();
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        autoRow.style.marginBottom = "12px";
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}" ${settings.autoComment ? "checked" : ""}>
            <label for="${autoId}">Auto-comment commits — don't show commit dialog</label>`;
        body.appendChild(autoRow);

        // Default commit message
        const commitField = this._field("Default commit message", settings.commitText, "feat: describe your change...");
        body.appendChild(commitField.el);

        // Sandbox workspace
        const workspaceField = this._browseField(
            "HoverIDE sandbox workspace",
            settings.sandboxWorkspace || "",
            "H:/projects/sandboxes"
        );
        body.appendChild(workspaceField.wrapper);

        this._win.setContent(body);
        this._win.addFooterBtn("Cancel", "mw-btn--ghost", () => this._win.close());
        this._win.addFooterBtn("Save", "mw-btn--primary", () => {
            updateIDESettings({
                autoComment:      body.querySelector(`#${autoId}`).checked,
                commitText:       commitField.input.value,
                sandboxWorkspace: workspaceField.input.value,
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

    _browseField(label, value, placeholder) {
        const { wrapper, input } = BrowseField.create({
            label, key: "_sandbox_workspace", placeholder, mode: "folder"
        });
        input.value = value;
        // Remove data-key to avoid being picked up by generic collectors
        delete input.dataset.key;
        return { wrapper, input };
    }
}