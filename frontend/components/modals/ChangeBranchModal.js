import ModalWindow from "../../core/ModalWindow.js";

export default class ChangeBranchModal {

    async open() {
        // Step 1: pick branch
        const res     = await fetch("/api/hoveride/branches");
        const branches = await res.json();
        const current  = (await fetch("/api/hoveride/branch").then(r => r.json())).branch;

        let selected = current;

        const picker = new ModalWindow({ title: "Change HoverIDE branch", width: 340 });
        picker.render();

        const list = document.createElement("div");
        list.className = "mw-proj-list";

        branches.forEach(b => {
            const item = document.createElement("div");
            item.className = "mw-proj-item" + (b === current ? " mw-proj-item--active" : "");
            item.innerHTML = `<div class="mw-proj-dot ${b === current ? "mw-proj-dot--active" : ""}"></div>
                <span class="mw-proj-name">${b}</span>
                ${b === current ? '<span class="mw-proj-branch">current</span>' : ""}`;
            item.onclick = () => {
                selected = b;
                list.querySelectorAll(".mw-proj-item, .mw-proj-dot").forEach(el => {
                    el.classList.remove("mw-proj-item--active", "mw-proj-dot--active");
                });
                item.classList.add("mw-proj-item--active");
                item.querySelector(".mw-proj-dot").classList.add("mw-proj-dot--active");
            };
            list.appendChild(item);
        });

        picker.setContent(list);
        picker.addFooterBtn("Cancel", "mw-btn--ghost", () => picker.close());
        picker.addFooterBtn("Select", "mw-btn--primary", () => {
            picker.close();
            this._showWarning(selected);
        });
        picker.show();
    }

    _showWarning(branch) {
        const warn = new ModalWindow({ title: "Switch branch", width: 340 });
        warn.render();

        const box = document.createElement("div");
        box.className = "mw-warn-box";
        box.innerHTML = `Switching to <strong>${branch}</strong> may break your current IDE build and settings. After confirming, the server will restart — manually refresh the extension and page.`;
        warn.setContent(box);

        warn.addFooterBtn("Cancel", "mw-btn--ghost", () => warn.close());
        warn.addFooterBtn("Switch & restart", "mw-btn--danger", async () => {
            await fetch("/api/hoveride/switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branch }),
            });
            warn.close();
        });
        warn.show();
    }
}