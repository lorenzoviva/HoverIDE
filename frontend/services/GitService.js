const PROJECT = "HoverIDE"; // TEMP (later dynamic)

export async function getStatus() {
    return fetch(`/api/git/status/${PROJECT}`).then(r => r.json());
}

export async function push() {
    return fetch('/api/git/push', { method: 'POST' });
}
