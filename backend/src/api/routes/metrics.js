import express from "express";
import { getMetrics } from "../../logger/metrics.js";

export const metricsRouter = express.Router();

metricsRouter.get("/", (_req, res) => {
  res.json(getMetrics());
});
