import express from "express";
import WorkspaceService from "../services/WorkspaceService.js";
import VCSService from "../services/VCSService.js";

const router = express.Router();

// Terminology clarification first — this matters for UX and naming:
//
// Write: save content to the local filesystem (sandbox worktree). Happens silently on every "Save" click. No dialog.
// Commit: git add + git commit on the local sandbox branch. Requires a commit message.
// Push: git push the local branch to remote.
// Promote: merge sandbox → root branch + push root. Requires a merge commit message.
// "Save" in HoverIDE UX = Write → Commit → Push → Promote, all in one flow. The commit dialog appears in between.


// Single-file save: write + commit + push + promote
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

// Mass commit: commit + push + promote without writing files (files already written)
router.post("/commit", async (req, res) => {
    try {
        const project = WorkspaceService.getProject();
        const { message, mergeMessage } = req.body;
        await VCSService.commit(project, message, mergeMessage);
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


export default router;