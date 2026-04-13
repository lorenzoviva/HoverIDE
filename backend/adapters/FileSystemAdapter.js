import fs from "fs";
import path from "path";
import os from "os";
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
    static listWithDirs(dir) {
        const results = [];
        const walk = (d) => {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            // If directory is completely empty, still record it
            if (entries.length === 0) {
                results.push({ path: d, isDir: true });
                return;
            }
            for (const entry of entries) {
                const full = path.join(d, entry.name);
                if (entry.isDirectory()) {
                    walk(full);
                } else {
                    results.push({ path: full, isDir: false });
                }
            }
        };
        walk(dir);
        return results;
    }
    static ls(dirPath) {
        // virtual root handling
        if (!dirPath || dirPath === "/") {
            return this.listRoots();
        }

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
        if (fs.statSync(filePath).isDirectory()) {
            fs.rmdirSync(filePath);
        } else {
            fs.unlinkSync(filePath);
        }
    }

    static create(filePath) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, "", "utf-8");
    }

    static mkdir(dirPath) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    static rename(from, to) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
    }

   static listRoots() {
       // Windows → drives
       if (process.platform === "win32") {
           const drives = [];

           for (let c = 65; c <= 90; c++) {
               const drive = String.fromCharCode(c) + ":/";
               try {
                   fs.accessSync(drive);
                   drives.push({
                       name: drive.replace("/", ""), // "C:"
                       path: drive,
                       isDir: true
                   });
               } catch {}
           }

           return drives;
       }

       // Unix → root is real root
       return this.ls("/");
   }
}