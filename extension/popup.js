const API = "http://localhost:3000";

let selectedProject = null;
let selectedSystem  = null;
let injected        = false;

const projectSelect = document.getElementById("project-select");
const systemSection = document.getElementById("section-system");
const systemList    = document.getElementById("system-list");
const injectBtn     = document.getElementById("inject-btn");
const ejectBtn      = document.getElementById("eject-btn");
const statusDot     = document.getElementById("status-dot");
const activeUrl     = document.getElementById("active-url");

// Show current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    activeUrl.textContent = tab?.url || "";
});

// Check if already injected on this tab
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "HOVERIDE_STATUS" }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.injected) setInjectedState(true);
    });
});

// Load project list
async function loadProjects() {
    try {
        const res  = await fetch(`${API}/api/project/list`);
        const list = await res.json();

        list.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            projectSelect.appendChild(opt);
        });

        // Pre-select active project if one is loaded
        const cur = await fetch(`${API}/api/project/current`).then(r => r.ok ? r.json() : null).catch(() => null);
        if (cur) {
            projectSelect.value = cur.name;
            await onProjectChange(cur.name);
        }
    } catch {
        /* backend not running */
    }
}

async function onProjectChange(name) {
    if (!name) {
        selectedProject = null;
        systemSection.style.display = "none";
        injectBtn.disabled = true;
        return;
    }

    const res = await fetch(`${API}/api/project/open`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name }),
    });

    selectedProject = await res.json();
    renderSystems(selectedProject.systems || []);
    systemSection.style.display = selectedProject.systems?.length ? "flex" : "none";
    injectBtn.disabled = false;
}

function renderSystems(systems) {
    systemList.innerHTML = "";
    selectedSystem = null;

    systems.forEach(sys => {
        const item = document.createElement("div");
        item.className = "system-item";
        item.innerHTML = `
            <span class="system-type">${sys.type}</span>
            <span class="system-id">${sys.id}</span>
        `;
        item.onclick = () => {
            document.querySelectorAll(".system-item").forEach(el => el.classList.remove("selected"));
            item.classList.add("selected");
            selectedSystem = sys;
        };
        systemList.appendChild(item);
    });

    // Auto-select first
    systemList.querySelector(".system-item")?.click();
}

function setInjectedState(on) {
    injected = on;
    statusDot.classList.toggle("active", on);
    injectBtn.style.display = on ? "none" : "block";
    ejectBtn.style.display  = on ? "block" : "none";
}

projectSelect.addEventListener("change", () => onProjectChange(projectSelect.value));

injectBtn.addEventListener("click", async () => {
    if (!selectedProject) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
        type:    "HOVERIDE_INJECT",
        project: selectedProject,
        system:  selectedSystem,
    });

    setInjectedState(true);
    window.close();
});

ejectBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: "HOVERIDE_EJECT" });
    setInjectedState(false);
});

loadProjects();