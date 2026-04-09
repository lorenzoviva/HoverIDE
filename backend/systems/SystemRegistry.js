import VanillaES6Frontend     from "./VanillaES6Frontend.js";
import NodeJSBackend          from "./NodeJSBackend.js";
import ChromeExtension        from "./ChromeExtension.js";
import ChromeExtensionPopup   from "./ChromeExtensionPopup.js";
import HoverIDEFrontend       from "./HoverIDEFrontend.js";
import HoverIDEBackend        from "./HoverIDEBackend.js";

const REGISTRY = {
    VanillaES6Frontend,
    NodeJSBackend,
    ChromeExtension,
    ChromeExtensionPopup,
    HoverIDEFrontend,
    HoverIDEBackend,
};

export default class SystemRegistry {

    static create(type, args) {
        const Cls = REGISTRY[type];
        if (!Cls) throw new Error(`Unknown system type: "${type}"`);
        return new Cls(args);
    }

    // Deserialise a plain JSON object back into a typed instance
    static fromJSON(raw) {
        return SystemRegistry.create(raw.type, raw);
    }

    static register(name, cls) {
        REGISTRY[name] = cls;
    }

    static types() {
        return Object.keys(REGISTRY);
    }
}