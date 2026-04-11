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
    let addResult = execSync(`git add .`, { cwd });
    console.log("Executed git add . in ", cwd, " results: ", addResult.toString());
    let commitResult = execSync(`git commit -m "${message}"`, { cwd });
    console.log(`Executed git commit -m "${message}"`, cwd, " results: ", commitResult.toString());

  }

  static createBranch(cwd, branch) {
    let results =  execSync(`git checkout -b ${branch}`, { cwd });
    console.log(`Executed git checkout -b ${branch} in`, cwd, " results: ", results.toString());
  }
  static clone(repo, targetPath) {
    let results = execSync(`git clone ${repo} "${targetPath}"`);
    console.log(`Executed git clone ${repo} "${targetPath}" in`, cwd, " results: ", results.toString());
  }

  static fetch(cwd) {
    let results = execSync(`git fetch`, { cwd });
    console.log(`Executed git fetch in`, cwd, " results: ", results.toString());
  }

  static checkout(cwd, branch) {
    let results = execSync(`git checkout ${branch}`, { cwd });
    console.log(`Executed git checkout ${branch} in`, cwd, " results: ", results.toString());
  }

  static branchExists(cwd, branch) {
    const branches = execSync(`git branch`, { cwd }).toString();
    console.log(`Executed git branch in`, cwd, " results: ", branches);
    return branches.includes(branch);
  }

  static worktreeExists(worktreePath) {
    return fs.existsSync(worktreePath);
  }
  static addAll(cwd) {
    let results = execSync(`git add .`, { cwd });
    console.log(`Executed git add . in`, cwd, " results: ", results.toString());
  }

  static commit(cwd, message) {
    try {
      let results = execSync(`git commit -m "${message}"`, { cwd });
      console.log(`Executed git commit -m "${message}" in`, cwd, " results: ", results.toString());
    } catch {
      // avoid crash if nothing to commit
       console.log(`Error executing git commit -m "${message}" in`, cwd);
    }
  }

  static push(cwd) {
    let results = execSync(`git push`, { cwd });
    console.log(`Executed git push in`, cwd, " results: ", results.toString());
  }

  static merge(cwd, branch) {
    let results = execSync(`git merge --ff --no-commit origin/${branch}`, { cwd });
    console.log(`Executed git merge --ff --no-commit origin/${branch} in`, cwd, " results: ", results.toString());
  }

  static fetch(cwd) {
    let results = execSync(`git fetch`, { cwd });
    console.log(`Executed git fetch in`, cwd, " results: ", results.toString());
  }
    static listBranches(cwd) {
        const out = execSync(`git -C "${cwd}" branch -a --format="%(refname:short)"`)
            .toString().trim().split("\n")
            .map(b => b.trim().replace(/^origin\//, ""))
            .filter((b, i, arr) => b && arr.indexOf(b) === i);
                console.log(`Executed git -C "${cwd}" branch -a --format="%(refname:short) results:`, out);
        return out;
}
}