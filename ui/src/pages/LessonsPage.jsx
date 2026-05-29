import { useEffect, useMemo, useState } from "react";
import { createJob } from "../api/jobs.js";
import { getLessons } from "../api/courses.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { LanguageSelector } from "../components/common/LanguageSelector.jsx";
import { Spinner } from "../components/common/Spinner.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { LessonTable } from "../components/lessons/LessonTable.jsx";
import { PageWrapper } from "../components/layout/PageWrapper.jsx";
import { useCourses } from "../hooks/useCourses.js";

export function LessonsPage() {
  const { courses, loading: loadingCourses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState(["lug", "ach"]);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedCourseId && courses.length) setSelectedCourseId(courses[0].id);
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingLessons(true);
    setError("");
    getLessons(selectedCourseId)
      .then((payload) => setLessons(payload.lessons))
      .catch((apiError) => {
        setError(apiError.message);
        setLessons([]);
      })
      .finally(() => setLoadingLessons(false));
  }, [selectedCourseId]);

  const videoLessons = useMemo(
    () => lessons.filter((lesson) => lesson.lessonType === "Video"),
    [lessons]
  );

  async function queueLesson(lesson) {
    await Promise.all(
      selectedLanguages.map((targetLanguage) =>
        createJob({
          courseId: lesson.courseId || selectedCourseId,
          courseSlug: lesson.courseSlug,
          lessonId: lesson.id,
          targetLanguage
        })
      )
    );
    setMessage(`Queued ${selectedLanguages.length} jobs for lesson ${lesson.id}.`);
  }

  return (
    <PageWrapper>
      <div className="stats-grid">
        <StatCard label="Lessons" value={lessons.length} hint="All lessons in selected course" />
        <StatCard label="Video lessons" value={videoLessons.length} hint="Only these are translated" />
        <StatCard label="Skipped" value={Math.max(0, lessons.length - videoLessons.length)} hint="Non-video lesson types" />
      </div>
      <section className="toolbar-panel">
        <label className="field-label">
          Course
          <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </label>
        <LanguageSelector selected={selectedLanguages} onChange={setSelectedLanguages} />
      </section>
      {message ? <p className="notice success-notice">{message}</p> : null}
      {error ? <p className="notice">Could not load lessons: {error}</p> : null}
      {loadingCourses || loadingLessons ? <Spinner /> : null}
      {!loadingLessons && videoLessons.length ? (
        <LessonTable lessons={videoLessons} onQueueLesson={queueLesson} />
      ) : (
        <EmptyState title="No video lessons loaded" body="Choose a course with video lessons to build translation jobs." />
      )}
    </PageWrapper>
  );
}
