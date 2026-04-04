export default class Project {
  constructor({
    name,
    rootPath,
    hoverideBranch,
    systems = [],
    metadata = {}
  }) {
    this.name = name;
    this.rootPath = rootPath;
    this.hoverideBranch = hoverideBranch;
    this.systems = systems;
    this.metadata = metadata;
  }

  addSystem(system) {
    this.systems.push(system);
  }
}