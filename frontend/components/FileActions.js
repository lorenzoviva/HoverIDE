import { emit } from "../core/EventBus.js";

export function createFileActions(path) {
  const container = document.createElement("div");
  container.className = "file-actions";

  const edit = document.createElement("button");
  edit.innerText = "edit";
  edit.onclick = (e) => {
    e.stopPropagation();
    emit("file:open", path);
  };

  const del = document.createElement("button");
  del.innerText = "delete";
  del.onclick = async (e) => {
    e.stopPropagation();

    if (!confirm(`Delete ${path}?`)) return;

    emit("file:delete", path);
  };

  container.appendChild(edit);
  container.appendChild(del);

  return container;
}