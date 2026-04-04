import GitAdapter from "../adapters/GitAdapter.js";

export default class GitService {

  static getStatus(project) {
    return GitAdapter.status(project.rootPath);
  }

  static checkout(project, branch) {
    return GitAdapter.checkout(project.rootPath, branch);
  }

  static commit(project, message) {
    return GitAdapter.commit(project.rootPath, message);
  }

  static createBranch(project, branch) {
    return GitAdapter.createBranch(project.rootPath, branch);
  }
  static createWorktree(cwd, worktreePath, branch) {
    execSync(`git worktree add "${worktreePath}" ${branch}`, { cwd });
  }
}