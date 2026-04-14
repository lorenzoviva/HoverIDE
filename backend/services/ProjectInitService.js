import fs from "fs";
import path from "path";
import GitAdapter from "../adapters/GitAdapter.js";
import ProjectService from "./ProjectService.js";

export default class ProjectInitService {

    static initProject(config) {
        const {
            hoverIDEGit, hoverIDEBranch,
            name, projectGit,
            rootPath, rootBranch,
            localBranch,
            _autoClone   = false,
            _createBranch = true,
            sandboxWorkspaceRoot,
        } = config;

        // Derive localPath
        let localPath = config.localPath;
        if (_autoClone && sandboxWorkspaceRoot) {
            localPath = path.join(sandboxWorkspaceRoot, name);
        }
        if (!localPath) throw new Error("localPath is required");

        // 1. Clone root repo if needed
        if (!fs.existsSync(rootPath)) {
            GitAdapter.clone(projectGit, rootPath);
        }

        // 2. Checkout root branch
        GitAdapter.checkout(rootPath, rootBranch);

        // 3. Create sandbox branch if requested
        if (_createBranch && !GitAdapter.branchExists(rootPath, localBranch)) {
            GitAdapter.createBranch(rootPath, localBranch);
        }

        // 4. Create worktree (sandbox) if it doesn't exist
        if (!fs.existsSync(localPath)) {
            if (_autoClone) {
                // Clone directly into the sandbox workspace subfolder
                GitAdapter.clone(projectGit, localPath);
                GitAdapter.checkout(localPath, localBranch);
            } else {
                GitAdapter.createWorktree(rootPath, localPath, localBranch);
            }
        }

        // 5. Save HoverIDE.json into root repo
        fs.writeFileSync(
            path.join(rootPath, "HoverIDE.json"),
            JSON.stringify({ ...config, localPath }, null, 2)
        );

        // 6. Restart HoverIDE if branch mismatch
        let restartRequired = false;
        if (GitAdapter.branch(process.cwd()) !== hoverIDEBranch) {
            GitAdapter.checkout(process.cwd(), hoverIDEBranch);
            restartRequired = true;
        }

        // 7. Create project model
        const project = ProjectService.create({
            hoverIDEGit, hoverIDEBranch,
            name, git: projectGit,
            rootPath, rootBranch,
            localPath, localBranch,
        });

        return { project, restartRequired };
    }
}