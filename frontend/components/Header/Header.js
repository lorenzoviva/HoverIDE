import Component from "../../core/Component.js";
import MenuBar from "./MenuBar.js";
import { on, emit } from "../../core/EventBus.js";

export default class Header extends Component {

    mount() {
        this.root.classList.add("header");

        const menuBar = new MenuBar();
        this.root.appendChild(menuBar.render());

        // Project + branch badge (centred via CSS)
        this.badge = this.create("div", "header-badge");
        this.badgeIcon = this.create("span", "header-badge-icon");
        this.badgeIcon.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 019 8.5H7a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 017 7h2a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25z"/>
        </svg>`;
        this.badgeText = this.create("span", "header-badge-text");
        this.badgeText.textContent = "No project";
        this.badge.appendChild(this.badgeIcon);
        this.badge.appendChild(this.badgeText);
        this.root.appendChild(this.badge);

        // Right-side buttons
        const right = this.create("div", "header-right");

        const hBtn = this.create("button", "header-icon-btn");
        hBtn.title = "HoverIDE home";
        hBtn.textContent = "H";
        hBtn.onclick = () => window.open("/", "_blank");

        const closeBtn = this.create("button", "header-icon-btn header-icon-btn--close");
        closeBtn.title = "Close IDE";
        closeBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
        </svg>`;
        closeBtn.onclick = () => emit("ide:close");

        right.appendChild(hBtn);
        right.appendChild(closeBtn);
        this.root.appendChild(right);

        on("project:changed", (project) => {
            this.badgeText.textContent = project
                ? `${project.name}  •  ${project.hoverIDEBranch}`
                : "No project";
        });

        on("project:cleared", () => {
            this.badgeText.textContent = "No project";
        });
    }
}