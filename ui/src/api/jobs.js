import { apiRequest } from "./client.js";

export function getJobs() {
  return apiRequest("/jobs");
}

export function createJob(input) {
  return apiRequest("/jobs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function retryJob(jobId) {
  return apiRequest(`/jobs/${jobId}/retry`, {
    method: "POST"
  });
}

export function runJob(jobId) {
  return apiRequest(`/jobs/${jobId}/run`, {
    method: "POST"
  });
}
