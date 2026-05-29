import { createJob } from "../queue/jobManager.js";

function readArg(args, name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : "";
}

export async function translateCommand(args) {
  const courseId = readArg(args, "course");
  const lessonId = readArg(args, "lesson");
  const targetLanguage = readArg(args, "language") || "lug";

  if (!courseId) throw new Error("Missing --course <courseId>");

  const job = await createJob({ courseId, lessonId, targetLanguage });
  console.log(JSON.stringify({ job }, null, 2));
}
