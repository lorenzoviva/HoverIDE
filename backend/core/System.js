export default class System {
  constructor({
    id,
    type, // backend | frontend | extension | custom
    config = {},
    files = []
  }) {
    this.id = id;
    this.type = type;
    this.config = config;
    this.files = files;
  }
}