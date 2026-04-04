export default class File {
  constructor({
    path,
    systemId,
    metadata = {},
    tags = []
  }) {
    this.path = path;
    this.systemId = systemId;

    // future features
    this.metadata = metadata;
    this.tags = tags;

    // extensibility hooks
    this.links = {
      aiChats: [],
      specs: []
    };
  }
}