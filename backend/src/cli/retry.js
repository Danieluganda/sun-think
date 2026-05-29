import { updateJob } from "../queue/jobManager.js";

export async function retryCommand(args) {
  const [jobId] = args;
  if (!jobId) throw new Error("Usage: retry <jobId>");

  const job = await updateJob(jobId, { status: "queued", progress: 0, error: "" });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  console.log(JSON.stringify({ job }, null, 2));
}
