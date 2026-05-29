import { thinkificRequest } from "./client.js";
import { CAPTIONS_QUERY } from "./queries.js";

export async function fetchCaptions(lessonId) {
  const data = await thinkificRequest(CAPTIONS_QUERY, { lessonID: lessonId });
  const lesson = data.lesson;
  const captions = lesson.content?.captions || [];

  return captions.map((caption) => ({
    language: caption.languageCode,
    label: caption.languageLabel,
    url: caption.downloadUrl,
    content: caption.content,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    videoId: lesson.content?.videoId
  }));
}
