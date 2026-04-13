const _listeners = new Map();
const _wildcard  = new Set();

export function on(type, handler) {
    if (type === "*") {
        _wildcard.add(handler);
        return () => _wildcard.delete(handler);
    }
    if (!_listeners.has(type)) _listeners.set(type, new Set());
    _listeners.get(type).add(handler);
    return () => _listeners.get(type)?.delete(handler);
}

export function emit(type, payload) {
    // Every emission creates a standard envelope: { _type, ...payload }
    const envelope = typeof payload === "object" && payload !== null
        ? { ...payload, _type: type }
        : { value: payload, _type: type };

    _listeners.get(type)?.forEach(h => {
        try { h(payload); } catch (e) { console.error(`[EventBus] ${type}:`, e); }
    });
    // Wildcard receives the full envelope so scripts can read event.type
    _wildcard.forEach(h => {
        try { h(envelope); } catch (e) { console.error(`[EventBus] wildcard:`, e); }
    });
}

export function off(type, handler) {
    if (type === "*") { _wildcard.delete(handler); return; }
    _listeners.get(type)?.delete(handler);
}