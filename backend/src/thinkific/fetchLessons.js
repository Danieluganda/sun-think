import { thinkificRequest } from "./client.js";
import { LESSONS_QUERY } from "./queries.js";

export async function fetchLessons(courseId, { first = 100 } = {}) {
  const data = await thinkificRequest(LESSONS_QUERY, {
    courseID: courseId,
    chaptersFirst: 100,
    lessonsFirst: first
  });

  const chapters = data.course.curriculum?.chapters?.nodes || [];
  return chapters.flatMap((chapter, chapterIndex) =>
    (chapter.lessons?.nodes || []).map((lesson, lessonIndex) => ({
      ...lesson,
      chapterId: chapter.id,
      position: lessonIndex + 1,
      chapterPosition: chapterIndex + 1,
      courseId: data.course.id,
      courseName: data.course.name,
      courseSlug: data.course.slug
    }))
  );
}
