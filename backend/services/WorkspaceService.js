import fs from "fs";
import path from "path";
import { BASE_DIR } from "../utils/const.js";

let CURRENT_PROJECT = null;

const STATE_FILE = path.join(BASE_DIR, ".hoveride.state.json");

export default class WorkspaceService {

  static setProject(project) {
    CURRENT_PROJECT = project;

    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR, { recursive: true });
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify({ name: project.name }));
  }

  static restore(ProjectService) {
    if (!fs.existsSync(STATE_FILE)) return;

    const { name } = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    CURRENT_PROJECT = ProjectService.load(name);
  }

  static getProject() {
    if (!CURRENT_PROJECT) {
      throw new Error("No active project");
    }
    return CURRENT_PROJECT;
  }
}