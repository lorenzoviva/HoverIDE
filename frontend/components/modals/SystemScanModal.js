import ModalWindow from "../../core/ModalWindow.js";

export default class SystemScanModal {

    async open(system) {
        const win = new ModalWindow({ title: `Scan — ${system.type}`, width: 420 });
        win.render();

        const body = document.createElement("div");
        body.innerHTML = `<div style="font-size:11px;color:#666;margin-bottom:8px">Loading scan…</div>`;
        win.setContent(body);
        win.addFooterBtn("Close", "mw-btn--ghost", () => win.close());
        win.show();

        try {
            const res = await fetch(`/api/system/${system.id}/scan`);
            const data = await res.json();

            body.innerHTML = "";
            Object.entries(data).forEach(([key, val]) => {
                const section = document.createElement("div");
                section.style.marginBottom = "10px";

                const label = document.createElement("div");
                label.className = "mw-field-label";
                label.textContent = key;
                label.style.marginBottom = "4px";
                section.appendChild(label);

                if (Array.isArray(val)) {
                    if (!val.length) {
                        const empty = document.createElement("div");
                        empty.style.cssText = "font-size:11px;color:#555;padding:4px 0";
                        empty.textContent = "(none)";
                        section.appendChild(empty);
                    } else {
                        val.forEach(item => {
                            const row = document.createElement("div");
                            row.style.cssText = "font-size:11px;color:#bbb;font-family:monospace;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04)";
                            row.textContent = typeof item === "object" ? JSON.stringify(item) : String(item);
                            section.appendChild(row);
                        });
                    }
                } else {
                    const pre = document.createElement("pre");
                    pre.className = "mw-raw-json";
                    pre.textContent = JSON.stringify(val, null, 2);
                    section.appendChild(pre);
                }

                body.appendChild(section);
            });
        } catch (e) {
            body.innerHTML = `<div style="font-size:11px;color:#f48771">Scan failed: ${e.message}</div>`;
        }
    }
}