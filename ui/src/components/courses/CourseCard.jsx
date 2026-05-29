import { Eye, PlayCircle } from "lucide-react";
import { Button } from "../common/Button.jsx";
import { ProgressBar } from "../common/ProgressBar.jsx";

export function CourseCard({ course, onSelect, onQueue }) {
  return (
    <article className="course-card">
      <div>
        <h2>{course.name}</h2>
        <p>{course.description || course.slug || "No description available."}</p>
      </div>
      <ProgressBar value={course.progress || 0} />
      <div className="card-footer">
        <span>{course.lessonCount ?? "Checking"} lessons · {course.captionCount ?? 0} captions</span>
        <div className="inline-actions">
          <Button icon={Eye} onClick={() => onSelect?.(course)} variant="secondary">View</Button>
          <Button icon={PlayCircle} onClick={() => onQueue?.(course)} variant="secondary">Queue</Button>
        </div>
      </div>
    </article>
  );
}
