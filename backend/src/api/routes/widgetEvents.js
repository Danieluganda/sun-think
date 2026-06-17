import express from "express";
import { recordWidgetEvent } from "../../logger/metrics.js";

export const widgetEventsRouter = express.Router();

widgetEventsRouter.post("/", (req, res) => {
  recordWidgetEvent(req.body || {});
  res.status(202).json({ ok: true });
});
