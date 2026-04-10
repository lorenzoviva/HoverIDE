import { emit } from "../../core/EventBus.js";

export default class ExplorerContextMenu {

    show(x, y, path, isLeaf) {
        this._remove();

        const menu = document.createElement("div");
        menu.className = "ctx-menu";
        menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:99999`;

        const items = [
            { label: "New file",   action: () => emit("file:create:at", path) },
            ...(isLeaf ? [] : [{ label: "New folder", action: () => emit("folder:create:at", path) }]),
            null,
            { label: "Rename",  action: () => emit("file:rename", path) },
            { label: "Delete",  action: () => emit("file:delete", path), danger: true },
            null,
            { label: "Copy path",  action: () => navigator.clipboard.writeText(path) },
            { label: "Link to page resource", action: () => emit("resource:link", path) },
        ];

        items.forEach(item => {
            if (!item) {
                const sep = document.createElement("div");
                sep.className = "ctx-sep";
                menu.appendChild(sep);
                return;
            }
            const el = document.createElement("div");
            el.className = "ctx-item" + (item.danger ? " ctx-item--danger" : "");
            el.textContent = item.label;
            el.onclick = () => { item.action(); this._remove(); };
            menu.appendChild(el);
        });

        document.body.appendChild(menu);
        this._el = menu;

        const close = () => { this._remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 0);
    }

    _remove() {
        this._el?.remove();
        this._el = null;
    }
}