import { emit } from "./EventBus.js";

let CURRENT_PROJECT = null;

export function setProject(project) {
    CURRENT_PROJECT = project;
    emit("project:changed", project);
}

export function clearProject() {
    CURRENT_PROJECT = null;
    emit("project:cleared");
}

export function getProject() {
    return CURRENT_PROJECT;
}

export function hasProject() {
    return CURRENT_PROJECT !== null;
}