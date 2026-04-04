// MAIN ENTRY (runs in page, NOT inside iframe)

function initIframe() {
    const iframe = document.createElement("iframe");

    iframe.id = "hoveride-root";

    Object.assign(iframe.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        border: "none",
        zIndex: 999999
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

