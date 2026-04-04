import express from "express";
import GitService from "../services/GitService.js";
import ProjectService from "../services/ProjectService.js";

const router = express.Router();

router.get("/status/:project", (req, res) => {
  const project = ProjectService.load(req.params.project);
  res.json(GitService.getStatus(project));
});

router.post("/commit", (req, res) => {
  const { projectName, message } = req.body;
  const project = ProjectService.load(projectName);

  GitService.commit(project, message);

  res.sendStatus(200);
});

export default router;