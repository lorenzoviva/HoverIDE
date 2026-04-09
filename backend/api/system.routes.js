import express from "express";
import SystemService from "../services/SystemService.js";
import SystemRegistry from "../systems/SystemRegistry.js";
import ProjectService from "../services/ProjectService.js";

const router = express.Router();

router.get("/types", (_req, res) => {
    res.json(SystemRegistry.types());
});

router.post("/add", (req, res) => {
    const { projectName, type, config } = req.body;

    const project = ProjectService.load(projectName);
    const system  = SystemService.create(type, config);

    project.systems.push(system);
    ProjectService.save(project);

    res.json(system);
});

export default router;