import express from "express";
import { exportJobsCsv } from "../../export/csv.js";
import { exportJobsJson } from "../../export/json.js";

export const exportRouter = express.Router();

exportRouter.get("/json", async (_req, res, next) => {
  try {
    res.type("application/json").send(await exportJobsJson());
  } catch (error) {
    next(error);
  }
});

exportRouter.get("/csv", async (_req, res, next) => {
  try {
    res.type("text/csv").send(await exportJobsCsv());
  } catch (error) {
    next(error);
  }
});
