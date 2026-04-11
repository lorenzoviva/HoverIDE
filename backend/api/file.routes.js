import express from "express";
import FileSystemAdapter from "../adapters/FileSystemAdapter.js";
import ProjectService from "../services/ProjectService.js";
import path from "path";
import WorkspaceService from "../services/WorkspaceService.js";

const router = express.Router();

// helper
function resolvePath(relativePath) {
  const project = WorkspaceService.getProject();
  return path.join(project.localPath, relativePath);
}

// READ FILE
router.get("/read", (req, res) => {
  const { path: filePath } = req.query;

  const fullPath = resolvePath(filePath);

  const content = FileSystemAdapter.read(fullPath);
  res.send(content);
});

// WRITE FILE
router.post("/write", (req, res) => {
  const { path: filePath, content } = req.body;

  const fullPath = resolvePath(filePath);

  FileSystemAdapter.write(fullPath, content);

  res.sendStatus(200);
});

// DELETE FILE
router.post("/delete", (req, res) => {
  const { path: filePath } = req.body;

  const fullPath = resolvePath(filePath);

  FileSystemAdapter.delete(fullPath);

  res.sendStatus(200);
});

// CREATE FILE
router.post("/create", (req, res) => {
  const { path: filePath } = req.body;

  const fullPath = resolvePath(filePath);

  FileSystemAdapter.create(fullPath);

  res.sendStatus(200);
});

// LIST FILES
router.get("/list", (req, res) => {
  const projectPath = resolvePath(".");
  const files = FileSystemAdapter.list(projectPath)
    .map(f => path.relative(projectPath, f));

  res.json(files);
});

// Directory listing for FilePicker (returns immediate children, not recursive)
router.get("/ls", (req, res) => {
    const { path: dirPath } = req.query;
    const fullPath = dirPath || "/";

    try {
        const entries = fs.readdirSync(fullPath, { withFileTypes: true })
            .filter(e => !e.name.startsWith("."))
            .map(e => ({
                name:  e.name,
                path:  path.join(fullPath, e.name).replace(/\\/g, "/"),
                isDir: e.isDirectory(),
            }))
            .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
        res.json(entries);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


export default router;