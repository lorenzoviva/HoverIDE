import express from "express";
import scriptEngine from "../scripts/ScriptEngine.js";
import WorkspaceService from "../services/WorkspaceService.js";
import FileSystemAdapter from "../adapters/FileSystemAdapter.js";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/list", (_req, res) => {
    res.json(scriptEngine.list());
});

router.post("/reload", async (req, res) => {
    try {
        const { name } = req.body;
        await scriptEngine.unloadScript(name);
        const project = WorkspaceService.getProject();
        const filePath = path.join(project.localPath, ".hoverscripts", name);
        await scriptEngine._loadScript(filePath);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post("/create", async (req, res) => {
    try {
        const { name, content = "" } = req.body;
        const project = WorkspaceService.getProject();
        const dir = path.join(project.localPath, ".hoverscripts");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, name);
        FileSystemAdapter.write(filePath, content);
        // Auto-load the new script
        await scriptEngine._loadScript(filePath);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post("/reload-all", async (_req, res) => {
    try {
        const project = WorkspaceService.getProject();
        await scriptEngine.loadProject(project); // unloads then reloads all
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
export default router;