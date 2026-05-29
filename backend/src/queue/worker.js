import { updateJob } from "./jobManager.js";
import { logger } from "../logger/index.js";

export async function processJob(job) {
  logger.info("Processing job", { jobId: job.id });
  await updateJob(job.id, { status: "running", progress: 10 });

  try {
    await updateJob(job.id, { progress: 50 });
    await updateJob(job.id, { status: "completed", progress: 100 });
    return { ...job, status: "completed", progress: 100 };
  } catch (error) {
    await updateJob(job.id, { status: "failed", error: error.message });
    throw error;
  }
}
