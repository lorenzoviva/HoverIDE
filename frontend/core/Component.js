
export default class Component {
    constructor(root) {
        this.root = root;
    }

    mount() {}
    unmount() {}

    create(tag, className, content = "") {
        const el = document.createElement(tag);
        if (className) el.className = className;
        el.innerHTML = content;
        return el;
    }
}
