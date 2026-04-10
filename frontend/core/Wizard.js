export default class Wizard {

    // steps: [{ title, render(data) => HTMLElement, validate(data) => bool }]
    constructor({ title, width, steps, onFinish, onCancel }) {
        this.title    = title;
        this.width    = width || 420;
        this.steps    = steps;
        this.onFinish = onFinish;
        this.onCancel = onCancel;
        this.current  = 0;
        this.data     = {};
    }

    render() {
        const root = document.createElement("div");

        this.stepBarEl    = document.createElement("div");
        this.stepBarEl.className = "wiz-step-bar";
        this.stepLabelsEl = document.createElement("div");
        this.stepLabelsEl.className = "wiz-step-labels";
        this.bodyEl       = document.createElement("div");
        this.bodyEl.className = "wiz-body";
        this.footerEl     = document.createElement("div");
        this.footerEl.className = "wiz-footer";

        root.appendChild(this.stepLabelsEl);
        root.appendChild(this.stepBarEl);
        root.appendChild(this.bodyEl);
        root.appendChild(this.footerEl);

        this._renderStep();
        return root;
    }

    _renderStep() {
        // Step bar
        this.stepBarEl.innerHTML = this.steps.map((_, i) => {
            const cls = i < this.current ? "wiz-seg wiz-seg--done"
                      : i === this.current ? "wiz-seg wiz-seg--active"
                      : "wiz-seg";
            return `<div class="${cls}"></div>`;
        }).join("");

        this.stepLabelsEl.innerHTML = this.steps.map((s, i) => {
            const cls = i < this.current ? "wiz-lbl wiz-lbl--done"
                      : i === this.current ? "wiz-lbl wiz-lbl--active"
                      : "wiz-lbl";
            return `<span class="${cls}">${i + 1}. ${s.title}</span>`;
        }).join("");

        // Body
        this.bodyEl.innerHTML = "";
        const stepEl = this.steps[this.current].render(this.data);
        this.bodyEl.appendChild(stepEl);

        // Footer
        this.footerEl.innerHTML = "";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "mw-btn mw-btn--ghost";
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => this.onCancel?.();
        this.footerEl.appendChild(cancelBtn);

        if (this.current > 0) {
            const backBtn = document.createElement("button");
            backBtn.className = "mw-btn mw-btn--ghost";
            backBtn.textContent = "← Back";
            backBtn.onclick = () => { this.current--; this._renderStep(); };
            this.footerEl.appendChild(backBtn);
        }

        const isLast = this.current === this.steps.length - 1;
        const nextBtn = document.createElement("button");
        nextBtn.className = "mw-btn mw-btn--primary";
        nextBtn.textContent = isLast ? "Finish" : "Next →";
        nextBtn.onclick = () => {
            const step = this.steps[this.current];
            if (step.collect) step.collect(this.data);
            if (step.validate && !step.validate(this.data)) return;
            if (isLast) {
                this.onFinish?.(this.data);
            } else {
                this.current++;
                this._renderStep();
            }
        };
        this.footerEl.appendChild(nextBtn);
    }
}