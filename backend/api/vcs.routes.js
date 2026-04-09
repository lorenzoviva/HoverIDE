import express from "express";
import WorkspaceService from "../services/WorkspaceService.js";
import VCSService from "../services/VCSService.js";

const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    const { message } = req.body;

    const project = WorkspaceService.getProject();
    console.log("Saving project: ", project)
    await VCSService.save(project, message);

    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;