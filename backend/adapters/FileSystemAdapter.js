import fs from "fs";
import path from "path";

export default class FileSystemAdapter {

    static read(filePath) {
        return fs.readFileSync(filePath, "utf-8");
    }

    static write(filePath, content) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, "utf-8");
    }

    static list(dir) {
        function walk(d) {
            let results = [];
            for (const file of fs.readdirSync(d)) {
                const full = path.join(d, file);
                if (fs.statSync(full).isDirectory()) {
                    results = results.concat(walk(full));
                } else {
                    results.push(full);
                }
            }
            return results;
        }
        return walk(dir);
    }

    static ls(dirPath) {
        return fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(e => !e.name.startsWith("."))
            .map(e => ({
                name:  e.name,
                path:  path.join(dirPath, e.name).replace(/\\/g, "/"),
                isDir: e.isDirectory(),
            }))
            .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    }

    static delete(filePath) {
        fs.unlinkSync(filePath);
    }

    static create(filePath) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, "", "utf-8");
    }

    static mkdir(dirPath) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}