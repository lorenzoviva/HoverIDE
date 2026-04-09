import NodeJSBackend from "./NodeJSBackend.js";

export default class HoverIDEBackend extends NodeJSBackend {

    constructor(args) {
        super({
            ...args,
            config: {
                root:        "backend",
                packageJson: "package.json",
                startScript: "npm start",
                ...args.config,
            }
        });
    }

    describe() {
        return { ...super.describe(), label: "HoverIDE backend" };
    }
}