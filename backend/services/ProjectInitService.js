import fs from "fs";
import path from "path";
import GitAdapter from "../adapters/GitAdapter.js";
import ProjectService from "./ProjectService.js";

export default class ProjectInitService {

  static initProject({
    name,
    rootPath,
    hoverideBranch,
    isGitRepo,
    baseBranch,
    localBranch,
    worktreePath
  }) {

    // 1. Validate repo
    if (isGitRepo) {
      const gitFolder = path.join(rootPath, ".git");

      if (!fs.existsSync(gitFolder)) {
        throw new Error("Not a valid git repository");
      }
    }

    // 2. Create local branch if needed
    if (isGitRepo) {
      try {
        GitAdapter.createBranch(rootPath, localBranch);
      } catch {
        // branch may already exist → ignore
      }

      // 3. Create worktree (sandbox)
      GitAdapter.createWorktree(rootPath, worktreePath, localBranch);
    }

    // 4. Create project metadata
    const project = ProjectService.create({
      name,
      rootPath: worktreePath || rootPath,
      hoverideBranch
    });

    // 5. Save VCS metadata
    project.metadata.vcs = {
      isGitRepo,
      baseBranch,
      localBranch,
      worktreePath
    };

    ProjectService.save(project);

    return project;
  }
}