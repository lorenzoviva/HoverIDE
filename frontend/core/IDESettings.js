const DEFAULTS = {
    autoComment:              false,
    localToRemoteCommitText:  "",
    mergeCommitText:          "",
};

const KEY = "hoveride:settings";

function load() {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
        return { ...DEFAULTS };
    }
}

function save(settings) {
    localStorage.setItem(KEY, JSON.stringify(settings));
}

let _settings = load();

export function getIDESettings() {
    return { ..._settings };
}

export function updateIDESettings(patch) {
    _settings = { ..._settings, ...patch };
    save(_settings);
}