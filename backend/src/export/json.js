import { listJobs } from "../queue/jobManager.js";

export async function exportJobsJson() {
  return JSON.stringify({ jobs: await listJobs() }, null, 2);
}
