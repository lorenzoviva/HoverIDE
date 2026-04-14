import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";
import { getChangedFiles } from "../../services/GitService.js";

const STATUS_COLORS = {
    modified:  "#e2c08d",
    added:     "#73c991",
    deleted:   "#f48771",
    untracked: "#9cdcfe",
    renamed:   "#c586c0",
};

export default class CommitModal {

    async open({ files: preselected = [], onCommit } = {}) {
        const settings   = getIDESettings();
        const allChanged = await getChangedFiles();
        const preselectedSet = new Set(preselected);

        if (settings.autoComment) {
            const msg = settings.commitText || "auto";
            onCommit?.({ message: msg, files: allChanged.map(f => f.path) });
            return;
        }

        const win  = new ModalWindow({ title: "Commit changes", width: 400 });
        win.render();
        const body = document.createElement("div");

        // ── Changed files checklist ──
        if (!allChanged.length) {
            const empty = document.createElement("div");
            empty.style.cssText = "font-size:11px;color:#666;margin-bottom:10px;padding:8px;background:#1a1a1a;border-radius:3px";
            empty.textContent = "No changed files in working tree.";
            body.appendChild(empty);
        } else {
            const listLabel = document.createElement("div");
            listLabel.className = "mw-field-label";
            listLabel.textContent = "Changed files";
            listLabel.style.marginBottom = "4px";
            body.appendChild(listLabel);

            const list = document.createElement("div");
            list.className = "fp-tree";
            list.style.maxHeight = "160px";

            const checked = new Map();

            allChanged.forEach(({ path, label }, i) => {
                const row = document.createElement("div");
                row.className = "fp-row";
                row.dataset.path = path;

                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.className = "fp-cb";
                cb.checked = preselectedSet.size > 0 ? preselectedSet.has(path) : true;
                checked.set(path, cb.checked);
                cb.onchange = () => { checked.set(path, cb.checked); updateCount(); };

                const badge = document.createElement("span");
                badge.style.cssText = `font-size:9px;padding:0 4px;border-radius:2px;margin-right:4px;flex-shrink:0;
                    color:${STATUS_COLORS[label]||"#888"};background:${STATUS_COLORS[label]||"#888"}22;font-family:monospace`;
                badge.textContent = (label[0] || "?").toUpperCase();

                const parts = path.replace(/\\/g, "/").split("/");
                const name  = document.createElement("span");
                name.className = "fp-name";
                name.style.fontFamily = "monospace";
                name.title = path;
                name.textContent = parts[parts.length - 1];

                const dir = document.createElement("span");
                dir.style.cssText = "font-size:10px;color:#555;margin-left:4px;flex-shrink:0";
                dir.textContent = parts.slice(0, -1).join("/") || ".";

                row.append(cb, badge, name, dir);
                list.appendChild(row);
            });

            body.appendChild(list);

            const stagedBar = document.createElement("div");
            stagedBar.className = "mw-staged-bar";
            stagedBar.style.marginBottom = "10px";

            const stagedCount = document.createElement("span");
            stagedCount.style.color = "#4fc1ff";

            const selAll = document.createElement("span");
            selAll.className = "mw-link";
            selAll.textContent = "Select all";
            selAll.onclick = () => {
                list.querySelectorAll(".fp-cb").forEach(c => { c.checked = true; });
                allChanged.forEach(f => checked.set(f.path, true));
                updateCount();
            };

            stagedBar.append(stagedCount, selAll);
            body.appendChild(stagedBar);

            const updateCount = () => {
                const n = [...checked.values()].filter(Boolean).length;
                stagedCount.textContent = `${n} of ${allChanged.length} staged`;
            };
            updateCount();

            win._getChecked = () => [...checked.entries()].filter(([, v]) => v).map(([k]) => k);
        }

        // ── Commit message ──
        const msgLabel = document.createElement("div");
        msgLabel.className = "mw-field-label";
        msgLabel.style.marginBottom = "4px";
        msgLabel.textContent = "Commit message";
        body.appendChild(msgLabel);

        const msgInput = document.createElement("textarea");
        msgInput.className = "mw-textarea";
        msgInput.placeholder = settings.commitText || "feat: describe your change...";
        body.appendChild(msgInput);

        // ── Auto-comment checkbox ──
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        const autoId = `commit-auto-${Date.now()}`;
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}">
            <label for="${autoId}">Auto-comment — don't ask again</label>`;
        body.appendChild(autoRow);
        autoRow.querySelector("input").onchange = (e) => {
            updateIDESettings({ autoComment: e.target.checked });
        };

        win.setContent(body);
        win.addFooterBtn("Cancel", "mw-btn--ghost", () => win.close());
        win.addFooterBtn("Commit", "mw-btn--primary", async () => {
            const stagedFiles = win._getChecked ? win._getChecked() : allChanged.map(f => f.path);
            if (!stagedFiles.length) { alert("No files selected."); return; }
            const message = msgInput.value.trim() || msgInput.placeholder;
            win.close();
            await onCommit?.({ message, files: stagedFiles });
        });

        win.show();
    }
}