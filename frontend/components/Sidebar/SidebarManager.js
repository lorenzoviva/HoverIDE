import { on } from "../../core/EventBus.js";

export default class SidebarManager {

    constructor({ activityBar, sidebar, peekPanel, pinBtn, actFilesBtn }) {
        this.activityBar = activityBar;
        this.sidebar     = sidebar;
        this.peekPanel   = peekPanel;
        this.pinBtn      = pinBtn;
        this.actFilesBtn = actFilesBtn;
        this.pinned      = true;
        this.peekTimer   = null;
    }

    mount() {
        this.pinBtn.addEventListener("click", () => this.togglePin());
        this.actFilesBtn.addEventListener("click", () => this.toggleSidebar());

        this.activityBar.addEventListener("mouseenter", () => {
            if (this.pinned) return;
            clearTimeout(this.peekTimer);
            this.peekPanel.classList.add("visible");
        });

        this.activityBar.addEventListener("mouseleave", (e) => {
            if (this.pinned) return;
            if (this.peekPanel.contains(e.relatedTarget)) return;
            this.peekTimer = setTimeout(() => this.peekPanel.classList.remove("visible"), 120);
        });

        this.peekPanel.addEventListener("mouseenter", () => {
            if (this.pinned) return;
            clearTimeout(this.peekTimer);
        });

        this.peekPanel.addEventListener("mouseleave", (e) => {
            if (this.pinned) return;
            if (this.activityBar.contains(e.relatedTarget)) return;
            this.peekTimer = setTimeout(() => this.peekPanel.classList.remove("visible"), 120);
        });
    }

    togglePin() {
        this.pinned = !this.pinned;
        this.pinBtn.classList.toggle("pinned", this.pinned);
        this.sidebar.classList.toggle("collapsed", !this.pinned);
        this.actFilesBtn.classList.toggle("active", this.pinned);
        if (this.pinned) this.peekPanel.classList.remove("visible");
    }

    toggleSidebar() {
        if (!this.pinned) return;
        const collapsed = this.sidebar.classList.toggle("collapsed");
        this.actFilesBtn.classList.toggle("active", !collapsed);
    }
}