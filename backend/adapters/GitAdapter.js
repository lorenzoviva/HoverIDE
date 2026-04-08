import { execSync } from "child_process";

export default class GitAdapter {

  static status(cwd) {
    const output = execSync("git status --porcelain", { cwd }).toString();

    return output.split("\n").filter(Boolean).map(line => ({
      status: line.slice(0, 2),
      file: line.slice(3)
    }));
  }

  static branch(cwd) {
    return execSync("git branch --show-current", { cwd }).toString().trim();
  }


  static commit(cwd, message) {
    execSync(`git add .`, { cwd });
    execSync(`git commit -m "${message}"`, { cwd });
  }

  static createBranch(cwd, branch) {
    execSync(`git checkout -b ${branch}`, { cwd });
  }
  static clone(repo, targetPath) {
    execSync(`git clone ${repo} "${targetPath}"`);
  }

  static fetch(cwd) {
    execSync(`git fetch`, { cwd });
  }

  static checkout(cwd, branch) {
    execSync(`git checkout ${branch}`, { cwd });
  }

  static branchExists(cwd, branch) {
    const branches = execSync(`git branch`, { cwd }).toString();
    return branches.includes(branch);
  }

  static worktreeExists(worktreePath) {
    return fs.existsSync(worktreePath);
  }
}