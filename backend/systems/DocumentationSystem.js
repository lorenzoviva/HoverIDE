import BaseSystem from "./BaseSystem.js";

export default class DocumentationSystem extends BaseSystem {
    constructor(args) {
        super(args);
        // config: { root } — directory to scan for .md files
    }
    describe() {
        return { ...super.describe(), label: "Documentation", root: this.config.root };
    }
}