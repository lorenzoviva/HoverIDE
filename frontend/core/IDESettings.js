const DEFAULTS = {
    autoComment:      false,
    commitText:       "",        // was localToRemoteCommitText
    sandboxWorkspace: "",        // new: HoverIDE sandbox workspace root
};

const KEY = "hoveride:settings";

function load() {
    try {
        const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
        // Migrate old key names
        if (stored.localToRemoteCommitText && !stored.commitText) {
            stored.commitText = stored.localToRemoteCommitText;
        }
        return { ...DEFAULTS, ...stored };
    } catch { return { ...DEFAULTS }; }
}

function save(settings) {
    localStorage.setItem(KEY, JSON.stringify(settings));
}

let _settings = load();

export function getIDESettings() { return { ..._settings }; }
export function updateIDESettings(patch) {
    _settings = { ..._settings, ...patch };
    save(_settings);
}