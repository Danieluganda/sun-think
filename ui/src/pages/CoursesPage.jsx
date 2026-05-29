import { useMemo, useState } from "react";
import { createJob } from "../api/jobs.js";
import { LanguageSelector } from "../components/common/LanguageSelector.jsx";
import { CourseGrid } from "../components/courses/CourseGrid.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Spinner } from "../components/common/Spinner.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { PageWrapper } from "../components/layout/PageWrapper.jsx";
import { useCourses } from "../hooks/useCourses.js";

export function CoursesPage() {
  const { courses, loading, error } = useCourses();
  const [selectedLanguages, setSelectedLanguages] = useState(["lug", "ach"]);
  const [message, setMessage] = useState("");

  const totals = useMemo(() => {
    return {
      courses: courses.length,
      lessons: courses.reduce((sum, course) => sum + (Number(course.lessonCount) || 0), 0),
      captions: courses.reduce((sum, course) => sum + (Number(course.captionCount) || 0), 0)
    };
  }, [courses]);

  async function queueCourse(course) {
    const jobs = await Promise.all(
      selectedLanguages.map((targetLanguage) =>
        createJob({
          courseId: course.id,
          courseSlug: course.slug,
          targetLanguage
        })
      )
    );
    setMessage(`Queued ${jobs.length} course-level jobs for ${course.name}.`);
  }

  return (
    <PageWrapper>
      <div className="stats-grid">
        <StatCard label="Courses" value={totals.courses} hint="Fetched from Thinkific" />
        <StatCard label="Lessons" value={totals.lessons || "-"} hint="Loaded as courses are inspected" />
        <StatCard label="Captions" value={totals.captions || "-"} hint="English captions become jobs" />
      </div>
      <section className="toolbar-panel">
        <div>
          <h2>Target languages</h2>
          <p>Course queue actions use these target languages.</p>
        </div>
        <LanguageSelector selected={selectedLanguages} onChange={setSelectedLanguages} />
      </section>
      {message ? <p className="notice success-notice">{message}</p> : null}
      {error ? <p className="notice">Using local placeholder data: {error}</p> : null}
      {loading ? <Spinner /> : null}
      {!loading && courses.length ? (
        <CourseGrid courses={courses} onQueue={queueCourse} />
      ) : (
        <EmptyState title="No courses found" body="Connect Thinkific credentials to load courses." />
      )}
    </PageWrapper>
  );
}
