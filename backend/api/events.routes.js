import express from "express";
import eventBus from "../core/EventBus.js";

const router = express.Router();

// Server-Sent Events stream — one persistent connection per IDE client
router.get("/stream", (req, res) => {
    res.setHeader("Content-Type",  "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection",    "keep-alive");
    res.flushHeaders();

    // Send a heartbeat every 20s to keep the connection alive through proxies
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 20_000);

    const unsubscribe = eventBus.subscribeAll((event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
    });
});

export default router;