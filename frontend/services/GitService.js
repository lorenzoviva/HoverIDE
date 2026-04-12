const PROJECT = "HoverIDE"; // TEMP (later dynamic)

export async function getStatus() {
    return fetch(`/api/git/status/${PROJECT}`).then(r => r.json());
}

export async function push() {
    return fetch('/api/git/push', { method: 'POST' });
}

// export async function getStatus() {
//     return fetch("/api/git/status/current").then(r => r.json()).catch(() => []);
// }

// Returns [{ path, status, label }] from git status on the sandbox branch
export async function getChangedFiles() {
    return fetch("/api/git/changed").then(r => r.json()).catch(() => []);
}