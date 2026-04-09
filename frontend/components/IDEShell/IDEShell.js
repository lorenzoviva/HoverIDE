import { on } from "../../core/EventBus.js";

export default class IDEShell {

    constructor(shellEl) {
        this.shell = shellEl;
    }

    mount() {
        // Listen for collapse/expand requests from anywhere in the app
        on("ide:collapse", () => this.collapse());
        on("ide:expand",   () => this.expand());

        // Also allow the parent page to drive it via postMessage
        window.addEventListener("message", (e) => {
            if (e.data?.type === "IDE_COLLAPSE") this.collapse();
            if (e.data?.type === "IDE_EXPAND")   this.expand();
        });
    }

    collapse() {
        this.shell.classList.add("collapsed");
        window.parent.postMessage({ type: "IDE_COLLAPSE" }, "*");
    }

    expand() {
        this.shell.classList.remove("collapsed");
        window.parent.postMessage({ type: "IDE_EXPAND" }, "*");
    }
}