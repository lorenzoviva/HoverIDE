import FilePicker from "./FilePicker.js";

// Usage:
//   BrowseField.attach(inputEl, { mode: "folder" })
//   BrowseField.attach(inputEl, { mode: "file" })
//   BrowseField.attach(inputEl, { mode: "both", multi: true })

export default class BrowseField {

    static attach(inputEl, options = {}) {
        const wrap = inputEl.parentElement;

        // Ensure wrap is flex
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.gap = "6px";

        const btn = document.createElement("button");
        btn.className = "fp-browse-btn";
        btn.title = options.mode === "folder" ? "Browse folder" : "Browse file";
        btn.innerHTML = options.mode === "folder"
            ? `<svg width="13" height="12" viewBox="0 0 14 12" fill="currentColor"><path d="M12 3H7.4l-.7-.7A1 1 0 006 2H2a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1z"/></svg>`
            : `<svg width="11" height="13" viewBox="0 0 11 14" fill="currentColor"><path d="M6.5 0H1a1 1 0 00-1 1v12a1 1 0 001 1h9a1 1 0 001-1V4.5L6.5 0zM6.5 1.5L9.5 4.5H6.5V1.5z"/></svg>`;

        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const picker = new FilePicker({
                mode:  options.mode  || "both",
                multi: options.multi || false,
                root:  inputEl.value || "/",
            });
            const result = await picker.open();
            if (result !== null) {
                inputEl.value = Array.isArray(result) ? result.join(", ") : result;
                inputEl.dispatchEvent(new Event("input"));
            }
        };

        // Insert btn after input
        inputEl.after(btn);
    }

    // Convenience: create a full labeled field with browse button
    // Returns { wrapper, input }
    static create({ label, key, placeholder = "", mode = "both", multi = false }) {
        const wrapper = document.createElement("div");
        wrapper.className = "mw-field";

        const lbl = document.createElement("div");
        lbl.className = "mw-field-label";
        lbl.textContent = label;

        const inputWrap = document.createElement("div");
        inputWrap.style.cssText = "display:flex;align-items:center;gap:6px";

        const input = document.createElement("input");
        input.className = "mw-field-input";
        input.dataset.key = key;
        input.placeholder = placeholder;

        inputWrap.appendChild(input);
        wrapper.appendChild(lbl);
        wrapper.appendChild(inputWrap);

        BrowseField.attach(input, { mode, multi });

        return { wrapper, input };
    }
}