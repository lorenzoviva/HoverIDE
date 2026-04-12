import ModalWindow from "../../core/ModalWindow.js";
import { getIDESettings, updateIDESettings } from "../../core/IDESettings.js";
import { getChangedFiles } from "../../services/GitService.js";

// Status badge colours
const STATUS_COLORS = {
    modified:  "#e2c08d",
    added:     "#73c991",
    deleted:   "#f48771",
    untracked: "#9cdcfe",
    renamed:   "#c586c0",
};

export default class CommitModal {

    async open({ files: preselected = [], onCommit } = {}) {
        const settings = getIDESettings();

        // Load changed files from git status
        let allChanged = await getChangedFiles();

        // If the caller provided a preselection (e.g. single-file save), pre-check those
        const preselectedSet = new Set(preselected);

        if (settings.autoComment) {
            const msg = settings.localToRemoteCommitText || "auto";
            const toCommit = allChanged.map(f => f.path);
            onCommit?.({ message: msg, mergeMessage: msg, files: toCommit });
            return;
        }

        const win = new ModalWindow({ title: "Commit changes", width: 400 });
        win.render();

        const body = document.createElement("div");

        // ── Changed files checklist ──────────────────────
        if (allChanged.length === 0) {
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

            // Track checked state
            const checked = new Map(); // path → bool

            allChanged.forEach(({ path, label }) => {
                const row = document.createElement("div");
                row.className = "fp-row";

                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.className = "fp-cb";
                // Pre-check: if caller passed specific files, only check those; otherwise check all
                cb.checked = preselectedSet.size > 0 ? preselectedSet.has(path) : true;
                checked.set(path, cb.checked);

                cb.onchange = () => {
                    checked.set(path, cb.checked);
                    updateStagedCount();
                };

                const badge = document.createElement("span");
                badge.style.cssText = `font-size:9px;padding:0 4px;border-radius:2px;margin-right:4px;
                    color:${STATUS_COLORS[label] || "#888"};
                    background:${STATUS_COLORS[label] || "#888"}22;
                    font-family:monospace;flex-shrink:0`;
                badge.textContent = label[0].toUpperCase(); // M / A / D / U / R

                const name = document.createElement("span");
                name.className = "fp-name";
                name.style.fontFamily = "monospace";
                name.title = path;
                // Show only filename, full path in tooltip
                const parts = path.replace(/\\/g, "/").split("/");
                name.textContent = parts[parts.length - 1];

                const dir = document.createElement("span");
                dir.style.cssText = "font-size:10px;color:#555;margin-left:4px;flex-shrink:0";
                dir.textContent = parts.slice(0, -1).join("/") || ".";

                row.appendChild(cb);
                row.appendChild(badge);
                row.appendChild(name);
                row.appendChild(dir);
                list.appendChild(row);
            });

            body.appendChild(list);

            // Staged count
            const stagedBar = document.createElement("div");
            stagedBar.className = "mw-staged-bar";
            stagedBar.style.marginBottom = "10px";
            const stagedCount = document.createElement("span");
            stagedCount.style.color = "#4fc1ff";
            const selAll = document.createElement("span");
            selAll.className = "mw-link";
            selAll.textContent = "Select all";
            selAll.onclick = () => {
                list.querySelectorAll(".fp-cb").forEach(c => { c.checked = true; checked.set(c.closest(".fp-row")?.dataset?.path, true); });
                allChanged.forEach(f => checked.set(f.path, true));
                updateStagedCount();
            };
            stagedBar.appendChild(stagedCount);
            stagedBar.appendChild(selAll);
            body.appendChild(stagedBar);

            // Store path on each row for select-all
            list.querySelectorAll(".fp-row").forEach((row, i) => {
                row.dataset.path = allChanged[i]?.path;
            });

            const updateStagedCount = () => {
                const n = [...checked.values()].filter(Boolean).length;
                stagedCount.textContent = `${n} of ${allChanged.length} file${allChanged.length !== 1 ? "s" : ""} staged`;
            };
            updateStagedCount();

            // Expose updateStagedCount for checkbox handler closure
            list.querySelectorAll(".fp-row input").forEach((cb, i) => {
                cb.onchange = () => {
                    checked.set(allChanged[i].path, cb.checked);
                    updateStagedCount();
                };
            });

            // Make the staged bar var accessible to the commit handler
            win._getChecked = () => [...checked.entries()].filter(([, v]) => v).map(([k]) => k);
        }

        // ── Commit message ───────────────────────────────
        const msgLabel = document.createElement("div");
        msgLabel.className = "mw-field-label";
        msgLabel.style.marginBottom = "4px";
        msgLabel.textContent = "Commit message";
        body.appendChild(msgLabel);

        const msgInput = document.createElement("textarea");
        msgInput.className = "mw-textarea";
        msgInput.placeholder = settings.localToRemoteCommitText || "feat: describe your change...";
        body.appendChild(msgInput);

        // ── Auto-comment checkbox ────────────────────────
        const autoRow = document.createElement("div");
        autoRow.className = "mw-check-row";
        const autoId = `commit-auto-${Date.now()}`;
        autoRow.innerHTML = `<input type="checkbox" id="${autoId}">
            <label for="${autoId}">Auto-comment — don't ask again</label>`;
        body.appendChild(autoRow);
        autoRow.querySelector("input").onchange = (e) => {
            updateIDESettings({ autoComment: e.target.checked });
        };

        // ── Same-message checkbox ────────────────────────
        const mergeRow = document.createElement("div");
        mergeRow.className = "mw-check-row";
        const mergeId = `commit-merge-${Date.now()}`;
        mergeRow.innerHTML = `<input type="checkbox" id="${mergeId}" checked>
            <label for="${mergeId}">Same message for merge commit</label>`;
        body.appendChild(mergeRow);
        const mergeCb = mergeRow.querySelector("input");

        // ── Merge message ────────────────────────────────
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
            const stagedFiles = win._getChecked ? win._getChecked() : allChanged.map(f => f.path);
            if (!stagedFiles.length) { alert("No files selected."); return; }
            const message      = msgInput.value.trim()   || msgInput.placeholder;
            const mergeMessage = mergeCb.checked ? message : (mergeInput.value.trim() || mergeInput.placeholder);
            win.close();
            await onCommit?.({ message, mergeMessage, files: stagedFiles });
        });

        win.show();
    }
}