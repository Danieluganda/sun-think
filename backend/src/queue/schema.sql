CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  lesson_id TEXT,
  target_language TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
