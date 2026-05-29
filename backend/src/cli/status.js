import { getJobSummary, listJobs } from "../queue/jobManager.js";

export async function statusCommand() {
  console.log(JSON.stringify({ summary: await getJobSummary(), jobs: await listJobs() }, null, 2));
}
