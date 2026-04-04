
const EXT_ID = "knjelhlnejpjljdnbllmblfkekmlfefp";

export function send(msg) {
    return new Promise(res => {
        chrome.runtime.sendMessage(EXT_ID, msg, res);
    });
}
