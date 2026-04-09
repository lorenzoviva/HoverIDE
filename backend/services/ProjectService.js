import fs from "fs";
import path from "path";
import Project from "../core/Project.js";
import SystemService from "./SystemService.js";
import { BASE_DIR } from "../utils/const.js";

const STORAGE = path.join(BASE_DIR, "projects");

export default class ProjectService {

    static create(config) {
        const project = new Project(config);
        this.save(project);
        return project;
    }

    static checkStorage() {
        if (!fs.existsSync(STORAGE)) fs.mkdirSync(STORAGE, { recursive: true });
    }

    static save(project) {
        ProjectService.checkStorage();
        const file = path.join(STORAGE, `${project.name}.json`);
        fs.writeFileSync(file, JSON.stringify(project, null, 2));
    }

    static load(name) {
        const file = path.join(STORAGE, `${name}.json`);
        const raw  = JSON.parse(fs.readFileSync(file, "utf-8"));

        // Re-hydrate systems from plain JSON → typed instances
        raw.systems = (raw.systems || []).map(s => SystemService.fromJSON(s));

        return Object.assign(new Project(raw), raw);
    }
}