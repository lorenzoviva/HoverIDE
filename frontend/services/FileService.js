const PROJECT = "HoverIDE"; // TEMP (later dynamic)

export async function readFile(path) {
  return fetch(`/api/file/read?projectName=${PROJECT}&path=${encodeURIComponent(path)}`)
    .then(r => r.text());
}

export async function writeFile(path, content) {
  return fetch(`/api/file/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectName: PROJECT, path, content })
  });
}

export async function deleteFile(path) {
  return fetch(`/api/file/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectName: PROJECT, path })
  });
}

export async function createFile(path) {
  return fetch(`/api/file/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectName: PROJECT, path })
  });
}

export async function listFiles() {
  return fetch(`/api/file/list?projectName=${PROJECT}`)
    .then(r => r.json());
}