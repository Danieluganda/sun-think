import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/index.js";
import { logger } from "../logger/index.js";
import { fetchCaptions } from "../thinkific/fetchCaptions.js";
import { downloadSrt } from "../srt/downloader.js";
import { parseSrt } from "../srt/parser.js";
import { rebuildSrt } from "../srt/rebuilder.js";
import { translateCues } from "../sunbird/translate.js";
import { updateJob } from "./jobManager.js";

export async function processJob(job) {
  logger.info("Processing job", {
    jobId: job.id,
    lessonId: job.lessonId,
    targetLanguage: job.targetLanguage
  });

  await updateJob(job.id, { status: "running", progress: 0 });

  try {
    // 1. Fetch captions list from Thinkific
    await updateJob(job.id, { progress: 10 });
    const captions = await fetchCaptions(job.lessonId);

    const source =
      captions.find((c) => c.language === "en" || c.language === "eng") ||
      captions[0];

    if (!source) {
      throw new Error(`No captions found for lesson ${job.lessonId}`);
    }

    // 2. Download or read SRT content
    await updateJob(job.id, { progress: 20 });
    const srtText = source.url
      ? await downloadSrt(source.url)
      : source.content;

    if (!srtText) {
      throw new Error("Caption has no content or download URL");
    }

    // 3. Parse SRT into cues
    const cues = parseSrt(srtText);
    logger.info("Parsed SRT", { jobId: job.id, cues: cues.length });

    // 4. Translate cues via Sunbird AI
    await updateJob(job.id, { progress: 30 });
    const translatedCues = await translateCues(cues, {
      sourceLanguage: "en",
      targetLanguage: job.targetLanguage
    });
    await updateJob(job.id, { progress: 80 });

    // 5. Rebuild SRT from translated cues
    const outputSrt = rebuildSrt(translatedCues);

    // 6. Save to output directory
    const outputDir = path.join(
      config.outputDir,
      job.courseSlug || job.courseId,
      job.lessonId
    );
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${job.targetLanguage}.srt`);
    await fs.writeFile(outputPath, outputSrt, "utf8");

    logger.info("Job completed", { jobId: job.id, outputPath });
    await updateJob(job.id, { status: "completed", progress: 100, outputPath });

    return { ...job, status: "completed", progress: 100, outputPath };
  } catch (error) {
    logger.error("Job failed", { jobId: job.id, error: error.message });
    await updateJob(job.id, { status: "failed", error: error.message });
    throw error;
  }
}
