import { Download, PlayCircle } from "lucide-react";
import { Button } from "../common/Button.jsx";
import { Badge } from "../common/Badge.jsx";

export function LessonTable({ lessons, onQueueLesson }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Lesson</th>
            <th>Chapter</th>
            <th>Type</th>
            <th>Status</th>
            <th>Captions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id}>
              <td>{lesson.title || lesson.name || lesson.id}</td>
              <td>{lesson.chapterPosition || "-"}</td>
              <td>{lesson.lessonType}</td>
              <td><Badge tone={lesson.lessonType === "Video" ? "info" : "neutral"}>{lesson.lessonType === "Video" ? "ready" : "skip"}</Badge></td>
              <td>{lesson.captionCount ?? "Check"}</td>
              <td>
                <div className="inline-actions">
                  <Button icon={PlayCircle} onClick={() => onQueueLesson?.(lesson)} variant="secondary">Queue</Button>
                  <Button icon={Download} variant="secondary">SRT</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
