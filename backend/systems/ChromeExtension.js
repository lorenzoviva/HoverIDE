import BaseSystem from "./BaseSystem.js";

export default class ChromeExtension extends BaseSystem {

    constructor(args) {
        super(args);
        // config: { root, manifestPath }
    }

    getFileFilter() {
        const root = this.config.root || "extension";
        return (filePath) => filePath.startsWith(root);
    }

    describe() {
        return {
            ...super.describe(),
            label:    "Chrome extension",
            root:     this.config.root,
            manifest: this.config.manifestPath,
        };
    }
}