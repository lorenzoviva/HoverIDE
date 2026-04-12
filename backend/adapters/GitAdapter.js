import { execSync } from "child_process";
import fs from "fs";

export default class GitAdapter {

    static status(cwd) {
        const output = execSync("git status --porcelain", { cwd }).toString();
        return output.split("\n").filter(Boolean).map(line => ({
            status: line.slice(0, 2),
            file:   line.slice(3),
        }));
    }

    static branch(cwd) {
        return execSync("git branch --show-current", { cwd }).toString().trim();
    }

    static addAll(cwd) {
        execSync("git add .", { cwd });
    }

    static commit(cwd, message) {
        try {
            execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd });
        } catch {
            // nothing to commit — silently skip
        }
    }

    static push(cwd) {
        execSync("git push", { cwd });
    }

    static fetch(cwd) {
        execSync("git fetch", { cwd });
    }

    static checkout(cwd, branch) {
        execSync(`git checkout ${branch}`, { cwd });
    }

    // Fast-forward merge — no extra commit, just move the pointer
    static merge(cwd, branch) {
        execSync(`git merge --ff-only origin/${branch}`, { cwd });
    }

    static createBranch(cwd, branch) {
        execSync(`git checkout -b ${branch}`, { cwd });
    }

    static branchExists(cwd, branch) {
        return execSync("git branch", { cwd }).toString().includes(branch);
    }

    static clone(repo, targetPath) {
        execSync(`git clone ${repo} "${targetPath}"`);
    }

    static createWorktree(rootPath, worktreePath, branch) {
        execSync(`git worktree add "${worktreePath}" ${branch}`, { cwd: rootPath });
    }

    static worktreeExists(worktreePath) {
        return fs.existsSync(worktreePath);
    }

    static listBranches(cwd) {
        return execSync(`git -C "${cwd}" branch -a --format="%(refname:short)"`)
            .toString().trim().split("\n")
            .map(b => b.trim().replace(/^origin\//, ""))
            .filter((b, i, arr) => b && arr.indexOf(b) === i);
    }

    // Returns parsed log entries: [{ hash, author, date, message }]
    static log(cwd, n = 20) {
        const out = execSync(`git log -${n} --pretty=format:"%H|%an|%ai|%s"`, { cwd }).toString();
        return out.split("\n").filter(Boolean).map(line => {
            const [hash, author, date, ...rest] = line.split("|");
            return { hash, author, date, message: rest.join("|") };
        });
    }
}