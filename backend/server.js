import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

import projectRoutes from "./api/project.routes.js";
import systemRoutes from "./api/system.routes.js";
import gitRoutes from "./api/git.routes.js";
import hoverideRoutes from "./api/hoveride.routes.js";
import fileRoutes from "./api/file.routes.js";
import vcsRoutes from "./api/vcs.routes.js";
import eventsRoutes     from "./api/events.routes.js";
import scriptsRoutes from "./api/scripts.routes.js";

import eventBus        from "./core/EventBus.js";
import systemRuntime   from "./services/SystemRuntimeService.js";
import scriptEngine    from "./scripts/ScriptEngine.js";
import WorkspaceService from "./services/WorkspaceService.js";
import ProjectService   from "./services/ProjectService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Serve frontend + other folders
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/backend", express.static(__dirname));
app.use("/extension", express.static(path.join(__dirname, "../extension")));

app.use("/api/project", projectRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/git", gitRoutes);
app.use("/api/hoveride", hoverideRoutes);
app.use("/api/vcs", vcsRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/scripts", scriptsRoutes);

app.use("/api/events", eventsRoutes);

app.use("/monaco",
  express.static(
    path.join(process.cwd(), "node_modules/monaco-editor/min")
  )
);

app.post("/restart", (req, res) => {
  res.json({ message: "Restarting..." });

  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// Boot: if there's already an active project, start its adapters and scripts
async function boot() {
    try {
        WorkspaceService.restore(ProjectService);
        const project = WorkspaceService.getProject();
        await systemRuntime.initProject(project);
        await scriptEngine.loadProject(project);
        console.log("[boot] Systems and scripts loaded for:", project.name);
    } catch {
        // No active project on startup — that's fine
    }
}

boot();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
