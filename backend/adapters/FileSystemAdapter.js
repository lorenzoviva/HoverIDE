import fs from "fs";
import path from "path";

export default class FileSystemAdapter {

  static read(filePath) {
    return fs.readFileSync(filePath, "utf-8");
  }

  static write(filePath, content) {
    fs.writeFileSync(filePath, content, "utf-8");
  }

  static list(dir) {
    function walk(d) {
      let results = [];

      fs.readdirSync(d).forEach(file => {
        const full = path.join(d, file);

        if (fs.statSync(full).isDirectory()) {
          results = results.concat(walk(full));
        } else {
          results.push(full);
        }
      });

      return results;
    }

    return walk(dir);
  }
  static delete(filePath) {
    fs.unlinkSync(filePath);
  }

  static create(filePath) {
    fs.writeFileSync(filePath, "", "utf-8");
  }
}