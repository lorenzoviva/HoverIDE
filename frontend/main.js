// MAIN ENTRY (runs in page, NOT inside iframe)

function initIframe() {
    globalThis.iframe = document.createElement("iframe");

    iframe.id = "hoveride-root";

    Object.assign(iframe.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        border: "none",
        zIndex: 999999,
        overflow: "visible" // 👈 important
    });

    iframe.src = "/iframe.html";

    document.body.appendChild(iframe);
}

window.addEventListener("message", (event) => {

    const msg = event.data;

    if (msg.type === "GET_DOM") {
        event.source.postMessage({
            type: "DOM_RESPONSE",
            content: document.documentElement.outerHTML
        }, "*");
    }

    if (msg.type === "SET_DOM") {
        document.open();
        document.write(msg.content);
        document.close();
    }
    if (event.source !== iframe.contentWindow) return;

    if (msg.type === "IDE_COLLAPSE") {
        Object.assign(iframe.style, {
            width: "36px",
            height: "36px",
            bottom: "16px",
            right: "16px",
            top: "auto",
            left: "auto",
            borderRadius: "50%",
            pointerEvents: "auto"
        });
    }

    if (msg.type === "IDE_EXPAND") {
        Object.assign(iframe.style, {
            width: "100%",
            height: "100%",
            top: "0",
            left: "0",
            bottom: "auto",
            right: "auto",
            borderRadius: "0"
        });
    }

});

let trackingEnabled = true;

const observer = new MutationObserver(() => {
    if (!trackingEnabled) return;

    const iframe = document.getElementById("hoveride-root");

    iframe?.contentWindow.postMessage({
        type: "DOM_MUTATION",
        content: document.documentElement.outerHTML
    }, "*");
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
});

window.onload = () => {
    initIframe();
};

