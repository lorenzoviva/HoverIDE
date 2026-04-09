import GitAdapter from "../adapters/GitAdapter.js";

let commitCounter = 0;

export default class VCSService {

  static generateMessage(message) {
    if (message && message.trim()) return message;
    return `auto-${++commitCounter}`;
  }

  static async save(project, message) {

    const {
      localPath,
      rootPath,
      localBranch,
      rootBranch
    } = project;

    const commitMessage = this.generateMessage(message);

    //////////////////////////////////////////////////////
    // 1. COMMIT LOCAL
    //////////////////////////////////////////////////////
    GitAdapter.addAll(localPath);
    GitAdapter.commit(localPath, commitMessage);
    GitAdapter.push(localPath, localBranch);

    //////////////////////////////////////////////////////
    // 2. IF SAME BRANCH → STOP
    //////////////////////////////////////////////////////
    if (localBranch === rootBranch) return;

    //////////////////////////////////////////////////////
    // 3. MERGE INTO ROOT
    //////////////////////////////////////////////////////
    GitAdapter.fetch(rootPath);

    GitAdapter.checkout(rootPath, rootBranch);

    try {
      GitAdapter.merge(rootPath, localBranch);
    } catch (e) {
      throw new Error("Merge conflict detected. Manual resolution required.");
    }

    GitAdapter.push(rootPath, rootBranch);
  }
}