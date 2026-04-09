import ChromeExtension from "./ChromeExtension.js";

export default class ChromeExtensionPopup extends ChromeExtension {

    constructor(args) {
        super(args);
        // config adds: { popupUrl }
    }

    getUrlPattern() {
        return this.config.popupUrl || null;
    }

    describe() {
        return { ...super.describe(), label: "Chrome extension popup" };
    }
}