import SystemRegistry from "../systems/SystemRegistry.js";
import eventBus from "../core/EventBus.js";

class SystemRuntimeService {

    constructor() {
        this.adapters = new Map(); // systemId → adapter instance
    }

    async initProject(project) {
        // Stop any previously running adapters
        await this.stopAll();

        for (const system of (project.systems || [])) {
            await this._initSystem(system);
        }
    }

    async _initSystem(system) {
        const AdapterClass = await SystemRegistry.getAdapter(system.type);
        if (!AdapterClass) return; // no adapter for this type

        const adapter = new AdapterClass(system);

        // Wire adapter events into the global EventBus
        adapter.onEvent((event) => eventBus.dispatch(event));

        await adapter.init();
        await adapter.start();

        this.adapters.set(system.id, adapter);
    }

    async stopAll() {
        for (const adapter of this.adapters.values()) {
            await adapter.stop();
        }
        this.adapters.clear();
    }

    async stopSystem(systemId) {
        const adapter = this.adapters.get(systemId);
        if (adapter) {
            await adapter.stop();
            this.adapters.delete(systemId);
        }
    }

    async executeAction(systemId, action, payload = {}) {
        const adapter = this.adapters.get(systemId);
        if (!adapter) throw new Error(`No running adapter for system "${systemId}"`);
        return adapter.execute(action, payload);
    }

    async scanSystem(systemId) {
        const adapter = this.adapters.get(systemId);
        if (!adapter) throw new Error(`No running adapter for system "${systemId}"`);
        return adapter.scan();
    }
}

// Singleton — shared across the entire server process
export default new SystemRuntimeService();