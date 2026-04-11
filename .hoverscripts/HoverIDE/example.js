// .hoverscripts/example.js
// HoverScript: log all API requests

export default {

    onInit(ctx) {
        console.log("[example] HoverScript initialized");
    },

    onEvent(event, ctx) {
        if (event.type === "api.request") {
            console.log("[example] API →", event.payload.method, event.payload.url);
        }

        if (event.type === "fs.changed") {
            console.log("[example] File changed:", event.payload.path);
        }
    },

    onDispose() {
        console.log("[example] HoverScript disposed");
    },
};