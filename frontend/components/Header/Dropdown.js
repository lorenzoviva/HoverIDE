import MenuItem from "./MenuItem.js";

export default class Dropdown {

    constructor(label, items) {
        this.label = label;
        this.items = items;
    }

    render() {
        const container = document.createElement("div");
        container.className = "dropdown";

        const button = document.createElement("div");
        button.className = "dropdown-label";
        button.innerText = this.label;

        const menu = document.createElement("div");
        menu.className = "dropdown-menu hidden";

        this.items.forEach(item => {
            const menuItem = new MenuItem(item);
            menu.appendChild(menuItem.render());
        });

        // Toggle
        button.onclick = (e) => {
            e.stopPropagation();
            closeAllMenus();
            menu.classList.toggle("hidden");
        };

        container.appendChild(button);
        container.appendChild(menu);

        return container;
    }
}

// Close all menus globally
function closeAllMenus() {
    document.querySelectorAll(".dropdown-menu").forEach(m => {
        m.classList.add("hidden");
    });
}

// Close on click outside
document.addEventListener("click", closeAllMenus);