import crypto from "node:crypto";
import { readDb, writeDb } from "./db.js";

export async function listJobs() {
  const db = await readDb();
  return db.jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJob(jobId) {
  const db = await readDb();
  return db.jobs.find((job) => job.id === jobId) || null;
}

export async function createJob(input) {
  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    courseId: input.courseId,
    courseSlug: input.courseSlug || "",
    lessonId: input.lessonId || "",
    targetLanguage: input.targetLanguage,
    status: "queued",
    progress: 0,
    error: "",
    createdAt: now,
    updatedAt: now
  };

  const db = await readDb();
  db.jobs.push(job);
  await writeDb(db);
  return job;
}

export async function updateJob(jobId, patch) {
  const db = await readDb();
  const index = db.jobs.findIndex((job) => job.id === jobId);
  if (index === -1) return null;

  db.jobs[index] = {
    ...db.jobs[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await writeDb(db);
  return db.jobs[index];
}

export async function getJobSummary() {
  const jobs = await listJobs();
  const counts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total: jobs.length,
    counts,
    latest: jobs.slice(0, 5)
  };
}
