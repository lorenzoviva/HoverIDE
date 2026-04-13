import fs from "fs";
import path from "path";
import WorkspaceService from "../services/WorkspaceService.js";
import { NODE_RUNTIME_DIR } from "../utils/const.js"
// Backend ScriptEngine: file management only.
// Execution is handled by the frontend ScriptEngine (browser context).

class ScriptEngine {

    _scriptsDir(project) {
        return path.join(NODE_RUNTIME_DIR, "..", ".hoverscripts", project.name);
    }

    list() {
        try {
            const project = WorkspaceService.getProject();
            const dir = this._scriptsDir(project);
            if (!fs.existsSync(dir)) return [];
            let array = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
            console.log("Searching for scripts in folder:", dir, "found: ", array)
            return array;
        } catch { return []; }
    }

    read(name) {
        const project = WorkspaceService.getProject();
        const file = path.join(this._scriptsDir(project), name);
        return fs.readFileSync(file, "utf-8");
    }

    write(name, content) {
        const project = WorkspaceService.getProject();
        const dir = this._scriptsDir(project);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, name), content, "utf-8");
    }

    delete(name) {
        const project = WorkspaceService.getProject();
        fs.unlinkSync(path.join(this._scriptsDir(project), name));
    }
}

export default new ScriptEngine();