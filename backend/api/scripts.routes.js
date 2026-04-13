import express from "express";
import scriptEngine from "../scripts/ScriptEngine.js";

const router = express.Router();

router.get("/list", (_req, res) => {
    res.json(scriptEngine.list());
});

router.get("/read/:name", (req, res) => {
    try {
        res.type("text/javascript").send(scriptEngine.read(req.params.name));
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

router.post("/create", (req, res) => {
    try {
        const { name, content = "" } = req.body;
        scriptEngine.write(name, content);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post("/save", (req, res) => {
    try {
        scriptEngine.write(req.body.name, req.body.content);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.delete("/:name", (req, res) => {
    try {
        scriptEngine.delete(req.params.name);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;