import express from "express";
import GitService from "../services/GitService.js";
import ProjectService from "../services/ProjectService.js";
import WorkspaceService from "../services/WorkspaceService.js";
import GitAdapter from "../adapters/GitAdapter.js";

const router = express.Router();

router.get("/status/:project", (req, res) => {
  const project = ProjectService.load(req.params.project);
  res.json(GitService.getStatus(project));
});

router.get("/changed", (req, res) => {
    try {
        const project = WorkspaceService.getProject();
        const entries = GitAdapter.status(project.localPath);
        // Map git status codes to human-readable labels
        const files = entries.map(({ status, file }) => ({
            path:   file,
            status: status.trim(),
            label:  statusLabel(status),
        }));
        res.json(files);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post("/commit", (req, res) => {
  const { projectName, message } = req.body;
  const project = ProjectService.load(projectName);

  GitService.commit(project, message);

  res.sendStatus(200);
});


function statusLabel(code) {
    const c = code.trim();
    if (c === "M"  || c === "MM") return "modified";
    if (c === "A"  || c === "AM") return "added";
    if (c === "D")                return "deleted";
    if (c === "R")                return "renamed";
    if (c === "??")               return "untracked";
    return c;
}
export default router;