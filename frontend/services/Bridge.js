// Bridge: receives backend EventBus events via SSE and re-emits on the frontend EventBus

import { emit as frontendEmit } from "../core/EventBus.js";

let _source = null;
let _parentListeners = [];

export function connectBackendBridge() {
    if (_source) return; // already connected

    _source = new EventSource("/api/events/stream");

    _source.onmessage = (e) => {
        try {
            const event = JSON.parse(e.data);
            // Forward to frontend EventBus with a "backend:" prefix namespace
            frontendEmit(`backend:${event.type}`, event);
            // Also emit the raw type for adapters that want to listen directly
            frontendEmit(event.type, event);
        } catch { /* malformed event — ignore */ }
    };

    _source.onerror = () => {
        // Auto-reconnect is built into EventSource — no manual retry needed
        console.warn("[Bridge] SSE connection lost, browser will retry");
    };
}

export function disconnectBackendBridge() {
    _source?.close();
    _source = null;
}

// Legacy parent-frame message bridge (used by Editor for DOM sync)
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