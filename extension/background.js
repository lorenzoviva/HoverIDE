let repo = {
    working: {}
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.type === "TRACK_EDIT") {
        repo.working[msg.path] = msg.content;

        chrome.storage.local.set({ repo });
    }

    if (msg.type === "GET_FILE") {
        sendResponse({
            content: repo.working[msg.path]
        });
    }

    return true;
});

// Restore repo on startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["repo"], (data) => {
        if (data.repo) repo = data.repo;
    });
});