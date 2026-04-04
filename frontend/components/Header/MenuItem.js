export default class MenuItem {

    constructor({ label, action, submenu }) {
        this.label = label;
        this.action = action;
        this.submenu = submenu;
    }

    render() {
        const item = document.createElement("div");
        item.className = "menu-item";

        item.innerText = this.label;

        if (this.submenu) {
            item.classList.add("has-submenu");

            const sub = document.createElement("div");
            sub.className = "submenu hidden";

            this.submenu.forEach(subItem => {
                const child = new MenuItem(subItem);
                sub.appendChild(child.render());
            });

            item.appendChild(sub);

            item.onmouseenter = () => sub.classList.remove("hidden");
            item.onmouseleave = () => sub.classList.add("hidden");

        } else if (this.action) {
            item.onclick = (e) => {
                e.stopPropagation();
                this.action();
                document.dispatchEvent(new Event("click")); // close menus
            };
        }

        return item;
    }
}