const PROJECT = "HoverIDE"; // TEMP (later dynamic)

export async function readFile(path) {
  return fetch(`/api/file/read?path=${encodeURIComponent(path)}`)
    .then(r => r.text());
}

export async function writeFile(path, content) {
  return fetch(`/api/file/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content })
  });
}

export async function deleteFile(path) {
  return fetch(`/api/file/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });
}

export async function createFile(path) {
  return fetch(`/api/file/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });
}

export async function listFiles() {
  return fetch(`/api/file/list`)
    .then(r => r.json());
}