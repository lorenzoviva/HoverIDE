const EXTENSION_MAP = {
    // JS / TS
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",

    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",

    // Backend / config
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    iml: "xml",

    // Shell / scripts
    sh: "shell",
    bash: "shell",

    // Programming
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",

    // Markdown
    md: "markdown",
    mda: "markdown",

    // Git / config
    gitignore: "plaintext",
    env: "plaintext",

    // Default fallback
    txt: "plaintext"
};

const SPECIAL_FILES = {
    "package.json": "json",
    "tsconfig.json": "json",
    "Dockerfile": "dockerfile",
    "Makefile": "makefile"
};

export function getLanguageFromPath(path) {

    if (!path) return "plaintext";

    const file = path.split("/").pop();

    if (SPECIAL_FILES[file]) {
        return SPECIAL_FILES[file];
    }

    if (!file.includes(".")) return "plaintext";

    const ext = file.split(".").pop().toLowerCase();

    return EXTENSION_MAP[ext] || "plaintext";
}