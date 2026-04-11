import GitAdapter from "../adapters/GitAdapter.js";

let commitCounter = 0;

export default class VCSService {

    static _autoMessage() {
        return `auto-${++commitCounter}`;
    }

    // Write is already done by the time this is called.
    // This commits, pushes, and promotes.
    static async commit(project, message, mergeMessage) {
        const { localPath, rootPath, localBranch, rootBranch } = project;

        const localMsg = message?.trim()    || this._autoMessage();
        const rootMsg  = mergeMessage?.trim() || localMsg;

        // 1. Commit + push local sandbox branch
        GitAdapter.addAll(localPath);
        GitAdapter.commit(localPath, localMsg);
        GitAdapter.push(localPath);

        // 2. Promote to root branch (skip if same branch)
        if (localBranch === rootBranch) return;

        GitAdapter.fetch(rootPath);
        GitAdapter.checkout(rootPath, rootBranch);
        try {
            GitAdapter.merge(rootPath, localBranch);
            GitAdapter.commit(rootPath, rootMsg);
        } catch (e) {
            throw new Error("Merge conflict — manual resolution required.");
        }
        GitAdapter.push(rootPath);
    }

    // Convenience: write content to a path then commit.
    // Used by single-file save flow.
    static async save(project, filePath, content, message, mergeMessage) {
        const { default: FileSystemAdapter } = await import("../adapters/FileSystemAdapter.js");
        const path = await import("path");
        const fullPath = path.default.join(project.localPath, filePath);
        FileSystemAdapter.write(fullPath, content);
        await this.commit(project, message, mergeMessage);
    }
}