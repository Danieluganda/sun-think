import { JobRow } from "./JobRow.jsx";

export function JobTable({ jobs }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Lesson</th>
            <th>Language</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Created</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow job={job} key={job.id} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
