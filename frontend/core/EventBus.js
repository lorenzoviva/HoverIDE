
const listeners = {};

export function emit(event, data) {
    (listeners[event] || []).forEach(cb => cb(data));
}

export function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
}
