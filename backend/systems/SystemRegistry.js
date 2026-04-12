import VanillaES6Frontend   from "./VanillaES6Frontend.js";
import NodeJSBackend        from "./NodeJSBackend.js";
import ChromeExtension      from "./ChromeExtension.js";
import ChromeExtensionPopup from "./ChromeExtensionPopup.js";
import HoverIDEFrontend     from "./HoverIDEFrontend.js";
import HoverIDEBackend      from "./HoverIDEBackend.js";

const REGISTRY = {
    VanillaES6Frontend,
    NodeJSBackend,
    ChromeExtension,
    ChromeExtensionPopup,
    HoverIDEFrontend,
    HoverIDEBackend,
};

// Lazy-loaded adapter map — avoids circular imports and loads only what's needed
const ADAPTER_MAP = {
    VanillaES6Frontend:   () => import("./adapters/VanillaES6Adapter.js").then(m => m.default),
    HoverIDEFrontend:     () => import("./adapters/HoverIDEAdapter.js").then(m => m.default),
    NodeJSBackend:        () => import("./adapters/NodeJSAdapter.js").then(m => m.default),
    HoverIDEBackend:      () => import("./adapters/HoverIDEAdapter.js").then(m => m.default),
    ChromeExtension:      () => import("./adapters/VanillaES6Adapter.js").then(m => m.default),
    ChromeExtensionPopup: () => import("./adapters/VanillaES6Adapter.js").then(m => m.default),
};

export default class SystemRegistry {

    static create(type, args) {
        const Cls = REGISTRY[type];
        if (!Cls) throw new Error(`Unknown system type: "${type}"`);
        return new Cls(args);
    }

    static fromJSON(raw) {
        return SystemRegistry.create(raw.type, raw);
    }

    static async getAdapter(type) {
        const loader = ADAPTER_MAP[type];
        if (!loader) return null;
        return loader();
    }

    static register(name, cls, adapterLoader = null) {
        REGISTRY[name] = cls;
        if (adapterLoader) ADAPTER_MAP[name] = adapterLoader;
    }

    static types() {
        return Object.keys(REGISTRY);
    }
}