import GitAdapter from "../adapters/GitAdapter.js";

let commitCounter = 0;

export default class VCSService {

    static _autoMessage() {
        return `auto-${++commitCounter}`;
    }

    // Write is already done. Commit + push local, then promote to root.
    static async commit(project, message, mergeMessage) {
        const { localPath, rootPath, localBranch, rootBranch } = project;

        const localMsg = message?.trim() || this._autoMessage();

        // 1. Stage + commit + push local sandbox branch
        GitAdapter.addAll(localPath);
        GitAdapter.commit(localPath, localMsg);
        GitAdapter.push(localPath);

        // 2. Skip promotion if same branch
        if (localBranch === rootBranch) return;

        // 3. Promote: fetch → checkout root → merge (no extra commit) → push root
        GitAdapter.fetch(rootPath);
        GitAdapter.checkout(rootPath, rootBranch);
        try {
            GitAdapter.merge(rootPath, localBranch); // fast-forward merge, no commit needed
        } catch (e) {
            throw new Error("Merge conflict — manual resolution required.");
        }
        GitAdapter.push(rootPath);
    }

    static async save(project, filePath, content, message, mergeMessage) {
        const { default: FileSystemAdapter } = await import("../adapters/FileSystemAdapter.js");
        const { default: path } = await import("path");
        FileSystemAdapter.write(path.join(project.localPath, filePath), content);
        await this.commit(project, message, mergeMessage);
    }
}