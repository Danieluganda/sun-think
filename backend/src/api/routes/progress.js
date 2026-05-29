import express from "express";
import { getJobSummary } from "../../queue/jobManager.js";

export const progressRouter = express.Router();

progressRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ progress: await getJobSummary() });
  } catch (error) {
    next(error);
  }
});
