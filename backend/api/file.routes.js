import express from "express";
import FileSystemAdapter from "../adapters/FileSystemAdapter.js";
import ProjectService from "../services/ProjectService.js";
import path from "path";

const router = express.Router();

// helper
function resolvePath(project, relativePath) {
  return path.join(project.rootPath, relativePath);
}

// READ FILE
router.get("/read", (req, res) => {
  const { projectName, path: filePath } = req.query;

  const project = ProjectService.load(projectName);
  const fullPath = resolvePath(project, filePath);

  const content = FileSystemAdapter.read(fullPath);
  res.send(content);
});

// WRITE FILE
router.post("/write", (req, res) => {
  const { projectName, path: filePath, content } = req.body;

  const project = ProjectService.load(projectName);
  const fullPath = resolvePath(project, filePath);

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