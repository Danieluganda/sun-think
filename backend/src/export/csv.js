import { listJobs } from "../queue/jobManager.js";

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportJobsCsv() {
  const jobs = await listJobs();
  const headers = ["id", "courseId", "lessonId", "targetLanguage", "status", "progress", "createdAt"];
  const rows = jobs.map((job) => headers.map((header) => escapeCsv(job[header])).join(","));
  return [headers.join(","), ...rows].join("\n");
}
