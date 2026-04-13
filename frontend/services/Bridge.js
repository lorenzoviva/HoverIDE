import { emit as frontendEmit, on } from "../core/EventBus.js";

let _source = null;
let _parentListeners = [];

export function connectBackendBridge() {
    if (_source) return;

    _source = new EventSource("/api/events/stream");

    _source.onmessage = (e) => {
        try {
            const event = JSON.parse(e.data);

            // Forward to frontend EventBus — both namespaced and raw
            frontendEmit(`backend:${event.type}`, event);
            frontendEmit(event.type, event);

            // Map specific backend events to frontend conventions
            if (event.type === "project.systems.changed") {
                frontendEmit("project:systems:changed", event.payload);
            }
            if (event.type === "project.changed") {
                frontendEmit("project:changed", event.payload);
            }
        } catch { /* malformed — ignore */ }
    };

    _source.onerror = () => {
        console.warn("[Bridge] SSE lost, browser will retry");
    };
}

export function disconnectBackendBridge() {
    _source?.close();
    _source = null;
}

export function sendToParent(msg) {
    window.parent?.postMessage(msg, "*");
}

export function listenFromParent(handler) {
    const fn = (event) => {
        if (event.source !== window.parent) return;
        handler(event.data);
    };
    window.addEventListener("message", fn);
    _parentListeners.push(fn);
}