import express from "express";
import HoverIDEService from "../services/HoverIDEService.js";

const router = express.Router();

const HOVERIDE_PATH = process.cwd();

router.get("/branch", (req, res) => {
  res.json({
    branch: HoverIDEService.getCurrentBranch(HOVERIDE_PATH)
  });
});

router.post("/switch", (req, res) => {
  HoverIDEService.switchBranch(HOVERIDE_PATH, req.body.branch);
  res.sendStatus(200);
});

export default router;