// Bridge between iframe and parent

export function sendToParent(msg) {
    window.parent.postMessage(msg, "*");
}

export function listenFromParent(handler) {
    window.addEventListener("message", (event) => {
        handler(event.data);
    });
}