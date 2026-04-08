import fs from "fs";
import path from "path";
import GitAdapter from "../adapters/GitAdapter.js";
import ProjectService from "./ProjectService.js";

export default class ProjectInitService {

  static initProject(config) {

    const {
      hoverIDEGit,
      hoverIDEBranch,
      name,
      projectGit,
      rootPath,
      rootBranch,
      localPath,
      localBranch
    } = config;

    //////////////////////////////////////////////////////
    // 1. CLONE PROJECT
    //////////////////////////////////////////////////////

    if (!fs.existsSync(rootPath)) {
      GitAdapter.clone(projectGit, rootPath);
    }

    //////////////////////////////////////////////////////
    // 2. ROOT BRANCH
    //////////////////////////////////////////////////////

    GitAdapter.checkout(rootPath, rootBranch);

    //////////////////////////////////////////////////////
    // 3. LOCAL BRANCH
    //////////////////////////////////////////////////////

    if (!GitAdapter.branchExists(rootPath, localBranch)) {
      GitAdapter.createBranch(rootPath, localBranch);
    }

    //////////////////////////////////////////////////////
    // 4. WORKTREE (SANDBOX)
    //////////////////////////////////////////////////////

    if (!fs.existsSync(localPath)) {
      GitAdapter.createWorktree(rootPath, localPath, localBranch);
    }

    //////////////////////////////////////////////////////
    // 5. SAVE HoverIDE.json
    //////////////////////////////////////////////////////

    fs.writeFileSync(
      path.join(rootPath, "HoverIDE.json"),
      JSON.stringify(config, null, 2)
    );

    //////////////////////////////////////////////////////
    // 6. Restart HoverIDE if branch is different
    //////////////////////////////////////////////////////
    let restartRequired = false;
    if(GitAdapter.branch(process.cwd()) !== hoverIDEBranch) {
        GitAdapter.checkout(process.cwd(), hoverIDEBranch);
        restartRequired = true;
    }

    //////////////////////////////////////////////////////
    // 7. CREATE PROJECT MODEL
    //////////////////////////////////////////////////////

    const project = ProjectService.create({
      hoverIDEGit,
      hoverIDEBranch,
      name: name,
      git: projectGit,
      rootPath,
      rootBranch,
      localPath,
      localBranch,
      metadata: {
        vcs: {
          projectGit,
          rootPath,
          rootBranch,
          localPath,
          localBranch
        }
      }
    });

    return {project, restartRequired};
  }
}