import path from "path";

export const BASE_DIR = process.env.APPDATA
         ? path.join(process.env.APPDATA, "HoverIDEData")
         : path.join(process.env.HOME || process.env.USERPROFILE, ".hoveride");

export const NODE_RUNTIME_DIR = process.cwd();