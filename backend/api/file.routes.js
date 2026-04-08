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
  const { projectName, path: filePath } = req.body;

  const project = ProjectService.load(projectName);
  const fullPath = resolvePath(project, filePath);

  FileSystemAdapter.delete(fullPath);

  res.sendStatus(200);
});

// CREATE FILE
router.post("/create", (req, res) => {
  const { projectName, path: filePath } = req.body;

  const project = ProjectService.load(projectName);
  const fullPath = resolvePath(project, filePath);

  FileSystemAdapter.create(fullPath);

  res.sendStatus(200);
});

// LIST FILES
router.get("/list", (req, res) => {
  const { projectName } = req.query;

  const project = ProjectService.load(projectName);

  const files = FileSystemAdapter.list(project.rootPath)
    .map(f => path.relative(project.rootPath, f));

  res.json(files);
});

export default router;