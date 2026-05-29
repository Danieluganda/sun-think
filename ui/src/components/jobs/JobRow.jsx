import { formatDate } from "../../utils/formatters.js";
import { ProgressBar } from "../common/ProgressBar.jsx";
import { StatusBadge } from "./StatusBadge.jsx";

export function JobRow({ job }) {
  return (
    <tr>
      <td>{job.courseId}</td>
      <td>{job.lessonId || "All lessons"}</td>
      <td>{job.targetLanguage}</td>
      <td><StatusBadge status={job.status} /></td>
      <td><ProgressBar value={job.progress} /></td>
      <td>{formatDate(job.createdAt)}</td>
      <td>{job.error || "-"}</td>
    </tr>
  );
}
