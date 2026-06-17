import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, validateConfig } from "../../config/index.js";
import { requireAuth } from "./middleware/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { jobsRouter } from "./routes/jobs.js";
import { progressRouter } from "./routes/progress.js";
import { exportRouter } from "./routes/export.js";
import { languagesRouter } from "./routes/languages.js";
import { metricsRouter } from "./routes/metrics.js";
import { translateRouter } from "./routes/translate.js";
import { widgetEventsRouter } from "./routes/widgetEvents.js";
import { logger } from "../logger/index.js";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");

export function createServer() {
  validateConfig();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use("/widget", express.static(publicDir));
  app.use("/public/languages", languagesRouter);
  app.use("/public/translate", translateRouter);
  app.use("/public/widget-events", widgetEventsRouter);
  app.use(express.static(appDir));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "thinkific-sunbird-backend" });
  });

  app.use("/api", requireAuth);
  app.use("/api/courses", coursesRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/export", exportRouter);
  app.use("/api/languages", languagesRouter);
  app.use("/api/metrics", metricsRouter);
  app.use("/api/translate", translateRouter);

  app.get("*", (_req, res) => {
    res.sendFile(path.join(appDir, "index.html"));
  });

  app.use((error, _req, res, _next) => {
    logger.error(error.message, { stack: error.stack });
    res.status(500).json({ error: error.message });
  });

  return app;
}

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  createServer().listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
  });
}
