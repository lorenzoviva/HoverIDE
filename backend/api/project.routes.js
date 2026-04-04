import express from "express";
import ProjectService from "../services/ProjectService.js";
import ProjectInitService from "../services/ProjectInitService.js";

const router = express.Router();

router.post("/create", (req, res) => {
  const project = ProjectService.create(req.body);
  res.json(project);
});

router.get("/:name", (req, res) => {
  const project = ProjectService.load(req.params.name);
  res.json(project);
});

router.post("/init", (req, res) => {
  try {
    const project = ProjectInitService.initProject(req.body);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;