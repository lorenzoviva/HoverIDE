import express from "express";
import ProjectService from "../services/ProjectService.js";
import ProjectInitService from "../services/ProjectInitService.js";
import WorkspaceService from "../services/WorkspaceService.js";
import fs from "fs";
import path from "path";
import { BASE_DIR } from "../utils/const.js";

const router = express.Router();

///////////////////////////////////////////////////////////
// OPEN PROJECT
///////////////////////////////////////////////////////////

router.post("/open", (req, res) => {
  const { name } = req.body;

  try {
    const project = ProjectService.load(name);

    // set active project
    WorkspaceService.setProject(project);

    res.json(project);

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


///////////////////////////////////////////////////////////
// GET CURRENT PROJECT
///////////////////////////////////////////////////////////

router.get("/current", (req, res) => {
  try {
    const project = WorkspaceService.getProject();
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/create", (req, res) => {
  const project = ProjectService.create(req.body);
  res.json(project);
});

router.post("/init", (req, res) => {
  try {
    const result = ProjectInitService.initProject(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
///////////////////////////////////////////////////////////
// LIST PROJECTS
///////////////////////////////////////////////////////////

router.get("/list", (req, res) => {
  try {
    const dir = path.join(BASE_DIR, "projects");

    if (!fs.existsSync(dir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(dir);

    const projects = files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));

    res.json(projects);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get("/:name", (req, res) => {
  const project = ProjectService.load(req.params.name);
  res.json(project);
});

export default router;