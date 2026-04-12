import ModalWindow from "../../core/ModalWindow.js";
import { getProject } from "../../core/ProjectStore.js";
import { emit } from "../../core/EventBus.js";

export default class SystemSettingsModal {

    open(system) {
        const project = getProject();
        if (!project || !system) return;

        const win = new ModalWindow({ title: `System — ${system.type}`, width: 400 });
        win.render();

        const body = document.createElement("div");

        // Read-only info row
        const infoRow = document.createElement("div");
        infoRow.style.cssText = "display:flex;gap:8px;margin-bottom:12px;align-items:center";
        infoRow.innerHTML = `
            <span style="font-size:10px;color:#888;background:#1a1a1a;padding:2px 7px;border-radius:3px;border:1px solid rgba(255,255,255,.08)">${system.type}</span>
            <span style="font-size:10px;color:#555;font-family:monospace">${system.id}</span>
        `;
        body.appendChild(infoRow);

        // Config fields — render each key as an editable input
        const configLabel = document.createElement("div");
        configLabel.className = "mw-field-label";
        configLabel.textContent = "Config";
        configLabel.style.marginBottom = "6px";
        body.appendChild(configLabel);

        const inputs = {};
        const config = system.config || {};

        Object.entries(config).forEach(([key, val]) => {
            const field = document.createElement("div");
            field.className = "mw-field";
            const lbl = document.createElement("div");
            lbl.className = "mw-field-label";
            lbl.textContent = key;
            const inp = document.createElement("input");
            inp.className = "mw-field-input";
            inp.value = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
            inputs[key] = inp;
            field.appendChild(lbl);
            field.appendChild(inp);
            body.appendChild(field);
        });

        // Raw JSON toggle for adding new keys
        const rawToggle = document.createElement("div");
        rawToggle.className = "mw-raw-toggle";
        rawToggle.textContent = "▶ Raw config JSON";
        const rawArea = document.createElement("textarea");
        rawArea.className = "mw-textarea mw-raw-json";
        rawArea.style.display = "none";
        rawArea.style.fontFamily = "monospace";
        rawArea.style.minHeight = "80px";
        rawArea.value = JSON.stringify(config, null, 2);
        let rawOpen = false;
        rawToggle.onclick = () => {
            rawOpen = !rawOpen;
            rawToggle.textContent = (rawOpen ? "▼" : "▶") + " Raw config JSON";
            rawArea.style.display = rawOpen ? "block" : "none";
            if (rawOpen) {
                // Sync inputs → raw
                const live = {};
                Object.entries(inputs).forEach(([k, el]) => {
                    try { live[k] = JSON.parse(el.value); } catch { live[k] = el.value; }
                });
                rawArea.value = JSON.stringify(live, null, 2);
            }
        };
        body.appendChild(rawToggle);
        body.appendChild(rawArea);

        win.setContent(body);
        win.addFooterBtn("Cancel", "mw-btn--ghost", () => win.close());
        win.addFooterBtn("Save", "mw-btn--primary", async () => {
            let newConfig;
            if (rawOpen) {
                try { newConfig = JSON.parse(rawArea.value); }
                catch { alert("Invalid JSON"); return; }
            } else {
                newConfig = {};
                Object.entries(inputs).forEach(([k, el]) => {
                    try { newConfig[k] = JSON.parse(el.value); } catch { newConfig[k] = el.value; }
                });
            }

            // Patch system in project and persist
            const sys = project.systems.find(s => s.id === system.id);
            if (sys) sys.config = newConfig;

            await fetch("/api/project/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(project),
            });

            // Restart adapter for this system
            await fetch(`/api/system/${system.id}/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "restart" }),
            }).catch(() => {});

            emit("project:changed", project);
            win.close();
        });

        win.show();
    }
}