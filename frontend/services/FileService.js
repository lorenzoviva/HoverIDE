export async function listFilesWithDirs() {
    return fetch("/api/file/list-with-dirs").then(r => r.json());
}

export async function renameFile(from, to) {
    return fetch("/api/file/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
    });
}

// Keep all existing exports unchanged
export async function readFile(path) {
    return fetch(`/api/file/read?path=${encodeURIComponent(path)}`).then(r => r.text());
}
export async function writeFile(path, content) {
    return fetch("/api/file/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
    });
}
export async function deleteFile(path) {
    return fetch("/api/file/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
    });
}
export async function createFile(path) {
    return fetch("/api/file/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
    });
}
export async function createFolder(path) {
    return fetch("/api/file/mkdir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
    });
}
export async function listFiles() {
    return fetch("/api/file/list").then(r => r.json());
}
export async function lsDir(dirPath) {
    return fetch(`/api/file/ls?path=${encodeURIComponent(dirPath)}`).then(r => r.json());
}
export async function vcsCommit({ message, mergeMessage }) {
    return fetch("/api/vcs/commit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mergeMessage }),
    });
}