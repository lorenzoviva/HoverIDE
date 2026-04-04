import Dropdown from "./Dropdown.js";

export default class MenuBar {

    constructor() {
        this.menus = [
            {
                label: "HoverIDE",
                items: [
                    { label: "Change Branch", action: () => console.log("Change branch") },
                    { label: "Edit HoverIDE", action: () => window.open("/", "_blank") }
                ]
            },
            {
                label: "Project",
                items: [
                    { label: "Open Project", action: () => console.log("Open project") }
                ]
            },
            {
                label: "Systems",
                items: [
                    { label: "Backend", submenu: this.systemMenu("backend") },
                    { label: "Frontend", submenu: this.systemMenu("frontend") },
                    { label: "Extension", submenu: this.systemMenu("extension") }
                ]
            }
        ];
    }

    systemMenu(system) {
        return [
            { label: "List Files", action: () => console.log(system, "files") },
            { label: "Add File", action: () => console.log(system, "add file") },
            { label: "Data", action: () => console.log(system, "data") },
            { label: "Pages", action: () => console.log(system, "pages") }
        ];
    }

    render() {
        const bar = document.createElement("div");
        bar.className = "menu-bar";

        this.menus.forEach(menu => {
            const dropdown = new Dropdown(menu.label, menu.items);
            bar.appendChild(dropdown.render());
        });

        return bar;
    }
}