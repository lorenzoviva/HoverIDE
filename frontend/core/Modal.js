export default class Modal {
    constructor() {
        this.el = document.createElement("div");
        this.el.className = "modal hidden";

        this.content = document.createElement("div");
        this.content.className = "modal-content";

        this.el.appendChild(this.content);
        document.body.appendChild(this.el);
    }

    show() {
        this.el.classList.remove("hidden");
    }

    hide() {
        this.el.classList.add("hidden");
    }

    setContent(node) {
        this.content.innerHTML = "";
        this.content.appendChild(node);
    }
}