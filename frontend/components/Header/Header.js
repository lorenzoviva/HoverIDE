import Component from "../../core/Component.js";
import MenuBar from "./MenuBar.js";
import { on, emit } from "../../core/EventBus.js";

export default class Header extends Component {

     async mount() {
            this.root.classList.add("header");

            this.menuBar = new MenuBar();
            this.root.appendChild(await this.menuBar.render());

            this.badge = this.create("div", "header-badge");
            this.badge.innerHTML = `
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" class="header-badge-icon">
                    <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 019 8.5H7a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 017 7h2a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25z"/>
                </svg>
                <span class="header-badge-text">No project</span>
            `;
            this.root.appendChild(this.badge);

            const right = this.create("div", "header-right");


            this.closeBtn = this.create("button", "header-close-btn");
            this.closeBtn.title = "Minimise";
            this.closeBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M1 1l8 8M9 1L1 9"/>
            </svg>`;
            this.closeBtn.onclick = () => emit("ide:collapse");

            right.appendChild(this.closeBtn);
            this.root.appendChild(right);

            on("project:changed", (project) => {
                const text = this.root.querySelector(".header-badge-text");
                if (text) text.textContent = project
                    ? `${project.name}  •  ${project.hoverIDEBranch}`
                    : "No project";
            });

            on("project:cleared", () => {
                const text = this.root.querySelector(".header-badge-text");
                if (text) text.textContent = "No project";
            });
        }

        openOpenProjectModal(){
            this.menuBar.openOpenProjectModal();
        }
}