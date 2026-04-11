import { EventEmitter } from "events";

// Singleton backend event bus
// All adapters, services, and the script engine share this instance

class HoverEventBus extends EventEmitter {

    constructor() {
        super();
        this.setMaxListeners(100);
    }

    // Structured emit — always uses the event envelope format
    dispatch(event) {
        if (!event.type) throw new Error("EventBus.dispatch: event.type is required");
        const envelope = {
            systemId:  event.systemId  || null,
            type:      event.type,
            payload:   event.payload   || {},
            timestamp: event.timestamp || Date.now(),
        };
        this.emit(event.type, envelope);
        this.emit("*", envelope); // wildcard — ScriptEngine and SSE bridge listen here
    }

    subscribe(type, handler) {
        this.on(type, handler);
        return () => this.off(type, handler);
    }

    subscribeAll(handler) {
        this.on("*", handler);
        return () => this.off("*", handler);
    }
}

export default new HoverEventBus();