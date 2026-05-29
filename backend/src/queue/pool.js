import { listJobs } from "./jobManager.js";
import { processJob } from "./worker.js";

export async function drainQueue({ limit = 5 } = {}) {
  const queued = (await listJobs()).filter((job) => job.status === "queued").slice(0, limit);
  const results = [];

  for (const job of queued) {
    results.push(await processJob(job));
  }

  return results;
}
