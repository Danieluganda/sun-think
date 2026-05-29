import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/index.js";

export function lessonOutputDir({ courseSlug, lessonId }) {
  return path.join(config.outputDir, courseSlug || "unknown-course", String(lessonId || "unknown-lesson"));
}

export async function writeSubtitle({ courseSlug, lessonId, language, content }) {
  const dir = lessonOutputDir({ courseSlug, lessonId });
  await fs.mkdir(dir, { recursive: true });
  const filename = language === "en" ? "original_en.srt" : `translated_${language}.srt`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content);
  return filePath;
}
