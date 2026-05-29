import express from "express";
import { createJob, getJob, listJobs, updateJob } from "../../queue/jobManager.js";
import { processJob } from "../../queue/worker.js";

export const jobsRouter = express.Router();

jobsRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ jobs: await listJobs() });
  } catch (error) {
    next(error);
  }
});

jobsRouter.post("/", async (req, res, next) => {
  try {
    const job = await createJob(req.body);
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
});

jobsRouter.get("/:jobId", async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
});

jobsRouter.post("/:jobId/run", async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json({ job: await processJob(job) });
  } catch (error) {
    return next(error);
  }
});

jobsRouter.post("/:jobId/retry", async (req, res, next) => {
  try {
    const job = await updateJob(req.params.jobId, { status: "queued", progress: 0, error: "" });
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
});
