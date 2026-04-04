import GitAdapter from "../adapters/GitAdapter.js";

export default class HoverIDEService {

  static switchBranch(hoveridePath, branch) {
    GitAdapter.checkout(hoveridePath, branch);
  }

  static getCurrentBranch(hoveridePath) {
    return GitAdapter.branch(hoveridePath);
  }
}