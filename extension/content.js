if (!window.__hoveride_content_loaded__) {
    window.__hoveride_content_loaded__ = true;

    let iframe    = null;
    let observer  = null;
    let tracking  = true;

    function createIframe(project, system) {
//         const el = document.createElement("script");
//         const url = new URL("http://localhost:3000/main.js")
//         el.src =  url.toString();
//         return el;
        const el = document.createElement("iframe");
        el.id = "hoveride-root";

//         const url = new URL("http://localhost:3000/main.html");
        const url = new URL("http://localhost:3000/iframe.html");
//         const url = new URL(chrome.runtime.getURL("iframe.html"));
//         if (project) url.searchParams.set("project", project.name);
//         if (system)  url.searchParams.set("system", system.id);

        Object.assign(el.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            border: "none",
            zIndex: "999999",
            background: "transparent",
            pointerEvents: "auto", // IMPORTANT
            overflow: "visible" // 👈 important
        });

        el.src = url.toString();
        return el;
    }

    function inject(project, system) {
        if (iframe) return;

        iframe = createIframe(project, system);
        document.documentElement.appendChild(iframe);

        // Snapshot page resources and send to IDE
        const snapshot = {
            scripts:     [...document.scripts].map(s => s.src).filter(Boolean),
            stylesheets: [...document.styleSheets].map(s => s.href).filter(Boolean),
            images:      [...document.images].map(i => i.src).filter(Boolean),
        };

        iframe.addEventListener("load", () => {
            iframe.contentWindow.postMessage({ type: "PAGE_SNAPSHOT", snapshot }, "*");
        });


        // DOM bridge
        observer = new MutationObserver(() => {
            if (!tracking) return;
            iframe.contentWindow?.postMessage({
                type:    "DOM_MUTATION",
                content: document.documentElement.outerHTML,
            }, "*");
        });

        observer.observe(document.documentElement, {
            childList: true, subtree: true,
            attributes: true, characterData: true,
        });
    }

    function eject() {
        if (!iframe) return;
        iframe.remove();
        iframe = null;
        observer?.disconnect();
        observer = null;
    }

    // Message bridge: IDE ↔ page
    window.addEventListener("message", (event) => {
        const msg = event.data;
        if (!msg?.type) return;

        if (msg.type === "GET_DOM") {
            event.source.postMessage({
                type:    "DOM_RESPONSE",
                content: document.documentElement.outerHTML,
            }, "*");
        }

        if (msg.type === "SET_DOM") {
            tracking = false;
            document.open();
            document.write(msg.content);
            document.close();
            setTimeout(() => { tracking = true; }, 100);
        }

        // IDE collapsed/expanded → resize iframe
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

    // Messages from popup / background
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.type === "HOVERIDE_STATUS") {
            sendResponse({ injected: !!iframe });
        }
        if (msg.type === "HOVERIDE_INJECT") {
            inject(msg.project, msg.system);
        }
        if (msg.type === "HOVERIDE_EJECT") {
            eject();
        }
        return true;
    });
}