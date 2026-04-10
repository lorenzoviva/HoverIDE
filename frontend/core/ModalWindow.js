export default class ModalWindow {

    constructor({ title, width = 420, onClose } = {}) {
        this.title   = title;
        this.width   = width;
        this.onClose = onClose;
        this._el     = null;
    }

    render() {
        const overlay = document.createElement("div");
        overlay.className = "mw-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) this.close(); };

        const win = document.createElement("div");
        win.className = "mw-win";
        win.style.width = this.width + "px";

        const titlebar = document.createElement("div");
        titlebar.className = "mw-titlebar";

        const dots = document.createElement("div");
        dots.className = "mw-dots";
        const closeCircle = document.createElement("div");
        closeCircle.className = "mw-dot mw-dot--close";
        closeCircle.title = "Close";
        closeCircle.onclick = () => this.close();
        dots.appendChild(closeCircle);
        ["",""].forEach(() => {
            const d = document.createElement("div");
            d.className = "mw-dot";
            dots.appendChild(d);
        });

        const nameEl = document.createElement("span");
        nameEl.className = "mw-title-text";
        nameEl.textContent = this.title || "";

        titlebar.appendChild(dots);
        titlebar.appendChild(nameEl);
        win.appendChild(titlebar);

        this.body = document.createElement("div");
        this.body.className = "mw-body";
        win.appendChild(this.body);

        this.footer = document.createElement("div");
        this.footer.className = "mw-footer";
        win.appendChild(this.footer);

        overlay.appendChild(win);
        this._el = overlay;
        return overlay;
    }

    setContent(el) {
        this.body.innerHTML = "";
        this.body.appendChild(el);
    }

    setFooter(el) {
        this.footer.innerHTML = "";
        this.footer.appendChild(el);
    }

    addFooterBtn(label, cls, onClick) {
        const btn = document.createElement("button");
        btn.className = `mw-btn ${cls}`;
        btn.textContent = label;
        btn.onclick = onClick;
        this.footer.appendChild(btn);
        return btn;
    }

    show() {
        if (!this._el) this.render();
        if (!document.body.contains(this._el)) document.body.appendChild(this._el);
        this._el.classList.remove("mw-hidden");
    }

    close() {
        this._el?.classList.add("mw-hidden");
        this.onClose?.();
    }

    destroy() {
        this._el?.remove();
        this._el = null;
    }
}