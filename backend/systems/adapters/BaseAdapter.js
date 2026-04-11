export default class BaseAdapter {

    constructor(system) {
        this.system = system;
        this._emitHandler = null;
        this._running = false;
    }

    // Called once after construction — set up connections, watchers, etc.
    async init() {}

    // Scan the system and return a metadata snapshot
    async scan() { return {}; }

    // Start runtime observation
    async start() { this._running = true; }

    // Tear down all watchers and connections
    async stop() { this._running = false; }

    // Register the EventBus dispatch callback
    onEvent(cb) {
        this._emitHandler = cb;
    }

    // Adapters call this to push events
    emit(type, payload = {}) {
        this._emitHandler?.({
            systemId:  this.system.id,
            type,
            payload,
            timestamp: Date.now(),
        });
    }

    // Execute an action from HoverScript or UI
    async execute(action, payload = {}) {
        throw new Error(`${this.constructor.name} does not implement execute("${action}")`);
    }
}