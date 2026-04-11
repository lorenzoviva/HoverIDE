export default class BaseSystem {

    constructor({ id, config = {}, metadata = {} }) {
        if (new.target === BaseSystem) {
            throw new Error("BaseSystem is abstract");
        }
        this.id       = id || `${this.constructor.name}-${Date.now()}`;
        this.type     = this.constructor.name;
        this.config   = config;
        this.metadata = metadata;
    }

    describe() {
        return { id: this.id, type: this.type, config: this.config };
    }

    toJSON() {
        return { id: this.id, type: this.type, config: this.config, metadata: this.metadata };
    }
}