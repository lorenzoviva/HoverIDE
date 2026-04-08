export async function listProjects() {
  return fetch("/api/project/list").then(r => r.json());
}

export async function openProject(name) {
  return fetch("/api/project/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  }).then(r => r.json());
}

export async function getCurrentProject() {
  return fetch("/api/project/current").then(r => r.json());
}