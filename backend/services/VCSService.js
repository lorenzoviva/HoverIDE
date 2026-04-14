import GitAdapter from "../adapters/GitAdapter.js";

let commitCounter = 0;

export default class VCSService {

    static _autoMessage() {
        return `auto-${++commitCounter}`;
    }

    static async commit(project, message) {
        const { localPath, rootPath, localBranch, rootBranch } = project;
        const msg = message?.trim() || this._autoMessage();

        GitAdapter.addAll(localPath);
        GitAdapter.commit(localPath, msg);
        GitAdapter.push(localPath);

        if (localBranch === rootBranch) return;

        GitAdapter.fetch(rootPath);
        GitAdapter.checkout(rootPath, rootBranch);
        try {
            GitAdapter.merge(rootPath, localBranch);
        } catch {
            throw new Error("Merge conflict — manual resolution required.");
        }
        GitAdapter.push(rootPath);
    }

    static async save(project, filePath, content, message) {
        const { default: FileSystemAdapter } = await import("../adapters/FileSystemAdapter.js");
        const { default: path } = await import("path");
        FileSystemAdapter.write(path.join(project.localPath, filePath), content);
        await this.commit(project, message);
    }
}