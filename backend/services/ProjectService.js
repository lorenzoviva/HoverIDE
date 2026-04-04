import fs from "fs";
import path from "path";
import Project from "../core/Project.js";

const BASE_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, "HoverIDEData")
  : path.join(process.env.HOME || process.env.USERPROFILE, ".hoveride");

const STORAGE = path.join(BASE_DIR, "projects");

export default class ProjectService {

  static create({ name, rootPath, hoverideBranch }) {
    const project = new Project({
      name,
      rootPath,
      hoverideBranch,
      systems: []
    });

    this.save(project);
    return project;
  }

  static checkStorage(){
        if(fs.existsSync(STORAGE)) return;
        fs.mkdirSync(STORAGE, { recursive: true });
  }

  static save(project) {
    ProjectService.checkStorage();
    const file = path.join(STORAGE, `${project.name}.json`);
    fs.writeFileSync(file, JSON.stringify(project, null, 2));
  }

  static load(name) {
    const file = path.join(STORAGE, `${name}.json`);
    return JSON.parse(fs.readFileSync(file));
  }
}