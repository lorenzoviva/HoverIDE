export default class Wizard {

    constructor({ steps, onFinish, onCancel }) {
        this.steps    = steps;
        this.onFinish = onFinish;
        this.onCancel = onCancel;
        this.current  = 0;
    }

    render() {
        // Fresh isolated data per render call — fixes cross-instance contamination
        this._data   = {};
        this.current = 0;

        const root = document.createElement("div");
        this._stepLabels = document.createElement("div");
        this._stepLabels.className = "wiz-step-labels";
        this._stepBar = document.createElement("div");
        this._stepBar.className = "wiz-step-bar";
        this._body = document.createElement("div");
        this._body.className = "wiz-body";
        this._footer = document.createElement("div");
        this._footer.className = "wiz-footer";

        root.appendChild(this._stepLabels);
        root.appendChild(this._stepBar);
        root.appendChild(this._body);
        root.appendChild(this._footer);

        this._draw();
        return root;
    }

    _draw() {
        const n = this.steps.length;

        this._stepBar.innerHTML = this.steps.map((_, i) => {
            const c = i < this.current ? "wiz-seg--done"
                    : i === this.current ? "wiz-seg--active" : "";
            return `<div class="wiz-seg ${c}"></div>`;
        }).join("");

        this._stepLabels.innerHTML = this.steps.map((s, i) => {
            const c = i < this.current ? "wiz-lbl--done"
                    : i === this.current ? "wiz-lbl--active" : "";
            return `<span class="wiz-lbl ${c}">${i + 1}. ${s.title}</span>`;
        }).join("");

        this._body.innerHTML = "";
        this._body.appendChild(this.steps[this.current].render(this._data));

        this._footer.innerHTML = "";

        const cancel = this._btn("Cancel", "mw-btn--ghost", () => this.onCancel?.());
        this._footer.appendChild(cancel);

        if (this.current > 0) {
            const back = this._btn("← Back", "mw-btn--ghost", () => {
                this.current--;
                this._draw();
            });
            this._footer.appendChild(back);
        }

        const last = this.current === n - 1;
        const next = this._btn(last ? "Finish" : "Next →", "mw-btn--primary", () => {
            const step = this.steps[this.current];
            if (step.collect) step.collect(this._data);
            if (step.validate && !step.validate(this._data)) return;
            if (last) {
                this.onFinish?.(this._data);
            } else {
                this.current++;
                this._draw();
            }
        });
        this._footer.appendChild(next);
    }

    _btn(label, cls, onClick) {
        const b = document.createElement("button");
        b.className = `mw-btn ${cls}`;
        b.textContent = label;
        b.onclick = onClick;
        return b;
    }
}