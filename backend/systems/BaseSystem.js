export default class BaseSystem {

    constructor({ id, config = {}, files = [], metadata = {} }) {
        if (new.target === BaseSystem) {
            throw new Error("BaseSystem is abstract — instantiate a subclass");
        }
        this.id         = id || `${this.constructor.name}-${Date.now()}`;
        this.type       = this.constructor.name;  // canonical type name
        this.config     = config;
        this.files      = files;                  // File[] attached to this system
        this.metadata   = metadata;
    }

    // Override in subclass: returns a fn(filePath) => bool
    // used to auto-classify files into this system during project scan
    getFileFilter() {
        return () => false;
    }

    // Override: returns a URL pattern string this system lives at
    // e.g. "http://localhost:3000/*"
    getUrlPattern() {
        return null;
    }

    // Override: human-readable summary for the IDE UI
    describe() {
        return { type: this.type, id: this.id };
    }

    toJSON() {
        return {
            type:     this.type,
            id:       this.id,
            config:   this.config,
            files:    this.files,
            metadata: this.metadata,
        };
    }
}