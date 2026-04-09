import VanillaES6Frontend from "./VanillaES6Frontend.js";

export default class HoverIDEFrontend extends VanillaES6Frontend {

    constructor(args) {
        super({
            ...args,
            config: {
                root: "frontend",
                devServerUrl: "http://localhost:3000/*",
                ...args.config,
            }
        });
    }

    describe() {
        return { ...super.describe(), label: "HoverIDE frontend" };
    }
}