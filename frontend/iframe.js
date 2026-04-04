import Header from "./components/Header/Header.js";
import Explorer from "./components/Explorer/Explorer.js";
import Editor from "./components/Editor/Editor.js";

window.addEventListener("DOMContentLoaded", () => {

    const header = new Header(document.getElementById("header"));
    window.explorerC = new Explorer(document.getElementById("explorer"));
    const editor = new Editor(document.getElementById("editor"));

    header.mount();
    explorerC.mount();
    editor.mount();

});

