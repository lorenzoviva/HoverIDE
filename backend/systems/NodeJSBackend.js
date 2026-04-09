import BaseSystem from "./BaseSystem.js";

export default class NodeJSBackend extends BaseSystem {

    constructor(args) {
        super(args);
        // config: { root, packageJson, startScript }
    }

    getFileFilter() {
        const root = this.config.root || "backend";
        return (filePath) => filePath.startsWith(root);
    }

    describe() {
        return {
            ...super.describe(),
            label:       "Node.js backend",
            root:        this.config.root,
            startScript: this.config.startScript,
        };
    }
}