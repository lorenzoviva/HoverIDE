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

  static checkout(cwd, branch) {
    execSync(`git checkout ${branch}`, { cwd });
  }

  static commit(cwd, message) {
    execSync(`git add .`, { cwd });
    execSync(`git commit -m "${message}"`, { cwd });
  }

  static createBranch(cwd, branch) {
    execSync(`git checkout -b ${branch}`, { cwd });
  }
}