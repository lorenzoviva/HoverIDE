export default class Project {
  constructor({
       hoverIDEGit,
       hoverIDEBranch,
       name,
       git,
       rootPath,
       rootBranch,
       localPath,
       localBranch,
    systems = [],
    metadata = {}
  }) {
    this.hoverIDEGit = hoverIDEGit;
    this.hoverIDEBranch = hoverIDEBranch;
    this.name = name;
    this.git = git;
    this.rootPath = rootPath;
    this.rootBranch = rootBranch;
    this.localPath = localPath;
    this.localBranch = localBranch;
    this.systems = systems;
    this.metadata = metadata;
  }

  addSystem(system) {
    this.systems.push(system);
  }
}