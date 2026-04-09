import BaseSystem from "./BaseSystem.js";

export default class VanillaES6Frontend extends BaseSystem {

    constructor(args) {
        super(args);
        // config: { root, devServerUrl }
    }

    getFileFilter() {
        const root = this.config.root || "frontend";
        return (filePath) => filePath.startsWith(root);
    }

    getUrlPattern() {
        return this.config.devServerUrl || null;
    }

    describe() {
        return {
            ...super.describe(),
            label: "Vanilla ES6 frontend",
            root:  this.config.root,
            url:   this.config.devServerUrl,
        };
    }
}