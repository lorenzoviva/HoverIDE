import SystemRegistry from "../systems/SystemRegistry.js";

export default class SystemService {

    static create(type, config = {}) {
        return SystemRegistry.create(type, { config });
    }

    static fromJSON(raw) {
        return SystemRegistry.fromJSON(raw);
    }
}