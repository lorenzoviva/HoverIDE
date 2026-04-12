import express from "express";
import SystemService from "../services/SystemService.js";
import SystemRegistry from "../systems/SystemRegistry.js";
import ProjectService from "../services/ProjectService.js";
import WorkspaceService from "../services/WorkspaceService.js";
import systemRuntime from "../services/SystemRuntimeService.js";
import eventBus from "../core/EventBus.js";

const router = express.Router();

router.get("/types", (_req, res) => {
    res.json(SystemRegistry.types());
});

router.post("/add", async (req, res) => {
    try {
        const { projectName, type, config } = req.body;
        const project = ProjectService.load(projectName);
        const system  = SystemService.create(type, config);
        project.systems.push(system);
        ProjectService.save(project);
        WorkspaceService.setProject(project)

        // Start the adapter
        await systemRuntime._initSystem(system);

        // Notify all connected IDE frontends via SSE
        eventBus.dispatch({
            type:    "project.systems.changed",
            payload: { projectName, system: system.toJSON() },
        });

        res.json(system);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post("/:systemId/execute", async (req, res) => {
    try {
        const result = await systemRuntime.executeAction(
            req.params.systemId, req.body.action, req.body.payload || {}
        );
        res.json({ result: result ?? null });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.get("/:systemId/scan", async (req, res) => {
    try {
        const result = await systemRuntime.scanSystem(req.params.systemId);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;