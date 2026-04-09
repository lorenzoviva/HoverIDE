import Header from "./components/Header/Header.js";
import Explorer from "./components/Explorer/Explorer.js";
import Editor from "./components/Editor/Editor.js";
import ProjectSelector from "./components/ProjectSelector.js";
import IDEShell from "./components/IDEShell/IDEShell.js";

import EditorBar   from "./components/Editor/EditorBar.js";
import SidebarManager from "./components/Sidebar/SidebarManager.js";
import Modal from "./core/Modal.js";
import { setProject, hasProject } from "./core/ProjectStore.js";
import { getCurrentProject } from "./services/ProjectService.js";
import { on, emit } from "./core/EventBus.js";

const modal = new Modal();

let explorer, editor, header;

async function bootstrap() {

    //////////////////////////////////////////////////////
    // Mount base UI (always)
    //////////////////////////////////////////////////////

    // Mount IDEShell first — it needs to be ready before any collapse events fire
    new IDEShell(document.querySelector(".ide-shell")).mount();
    document.getElementById("h-btn").addEventListener("click", () => emit("ide:expand"));

    // Header
    new Header(document.getElementById("header")).mount();

    // Explorer
    const explorer = new Explorer(document.getElementById("explorer"));
    explorer.mount();

    // Editor bar (path display + save button)
    new EditorBar(document.getElementById("editor-bar")).mount();

    // Editor (Save wired via event)
    const editor = new Editor(document.getElementById("editor"));
    editor.mount();

    // Sidebar manager — owns pin/hover behaviour
    const sidebarManager = new SidebarManager({
        activityBar: document.getElementById("activity-bar"),
        sidebar:     document.getElementById("sidebar"),
        peekPanel:   document.getElementById("peek-panel"),
        pinBtn:      document.getElementById("pin-btn"),
        actFilesBtn: document.getElementById("act-files"),
    });
    sidebarManager.mount();

    //////////////////////////////////////////////////////
    // Restore project
    //////////////////////////////////////////////////////

    try {
        const project = await getCurrentProject();
        if(project && !project.error) {
            console.log("Loading project: ", project)
            setProject(project);
            console.log("Loaded UI for project")
            hideModal();
            await explorer.mount();
        } else {
            showProjectSelector();
        }
    } catch {
        showProjectSelector();
    }

    //////////////////////////////////////////////////////
    // Events
    //////////////////////////////////////////////////////

    on("project:changed", async () => {
        hideModal();
        await explorer.mount();
    });

    on("project:cleared", () => {
        showProjectSelector();
    });
    on("project:change", () => {
        showProjectSelector();
    });
}

///////////////////////////////////////////////////////////
// MODAL HANDLING
///////////////////////////////////////////////////////////

function showProjectSelector() {
    const selector = new ProjectSelector();

    selector.onSelect = async (project) => {
        setProject(project);
    };

    selector.onCreate = async (project) => {
        setProject(project);
    };

    modal.setContent(selector.render());
    modal.show();
}

function hideModal() {
    modal.hide();
}

bootstrap();