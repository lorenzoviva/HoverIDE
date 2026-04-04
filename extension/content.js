// Prevent double injection
function main() {
  if (window.__hoveride_injected__) return;
  window.__hoveride_injected__ = true;

  ///////////////////////////
  // CREATE IFRAME
  ///////////////////////////

  function createIframe() {
    const iframe = document.createElement("iframe");

    iframe.id = "hoveride-root";

    Object.assign(iframe.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      border: "none",
      zIndex: 999999,
      background: "transparent"
    });

    // IMPORTANT: use extension URL
    // iframe.src = chrome.runtime.getURL("iframe.html");
    iframe.src = "http://localhost:3000/iframe.html";

    return iframe;
  }

  ///////////////////////////
  // INJECT INTO PAGE
  ///////////////////////////

  function inject() {
    const iframe = createIframe();

    document.documentElement.appendChild(iframe);

    return iframe;
  }

  const iframe = inject();

  ///////////////////////////
  // DOM OBSERVER (REAL PAGE)
  ///////////////////////////

  let trackingEnabled = true;

  const observer = new MutationObserver(() => {
    if (!trackingEnabled) return;

    iframe.contentWindow?.postMessage({
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

  ///////////////////////////
  // MESSAGE BRIDGE
  ///////////////////////////

  window.addEventListener("message", (event) => {
    const msg = event.data;

    if (!msg || !msg.type) return;

    // Iframe → Page

    if (msg.type === "GET_DOM") {
      event.source.postMessage({
        type: "DOM_RESPONSE",
        content: document.documentElement.outerHTML
      }, "*");
    }

    if (msg.type === "SET_DOM") {
      trackingEnabled = false;

      document.open();
      document.write(msg.content);
      document.close();

      setTimeout(() => {
        trackingEnabled = true;
      }, 100);
    }
  });
}
main();