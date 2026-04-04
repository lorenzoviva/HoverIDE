import System from "../core/System.js";

export default class SystemService {

  static createSystem(type, config) {

    switch (type) {

      case "backend":
        return new System({
          id: Date.now(),
          type,
          config: {
            packageJson: config.packageJson,
            startScript: config.startScript,
            src: config.src
          }
        });

      case "frontend":
        return new System({
          id: Date.now(),
          type,
          config: {
            root: config.root,
            urlPattern: config.urlPattern
          }
        });

      default:
        return new System({
          id: Date.now(),
          type,
          config
        });
    }
  }
}