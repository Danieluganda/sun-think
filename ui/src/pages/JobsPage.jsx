import { useMemo, useState } from "react";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Spinner } from "../components/common/Spinner.jsx";
import { JobTable } from "../components/jobs/JobTable.jsx";
import { RunControls } from "../components/jobs/RunControls.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { PageWrapper } from "../components/layout/PageWrapper.jsx";
import { useJobs } from "../hooks/useJobs.js";
import { countBy } from "../utils/formatters.js";

export function JobsPage() {
  const { jobs, loading, error } = useJobs({ pollMs: 5000 });
  const [selectedLanguages, setSelectedLanguages] = useState(["lug", "ach"]);
  const [paused, setPaused] = useState(false);
  const counts = useMemo(() => countBy(jobs, "status"), [jobs]);
  const completed = (counts.done || 0) + (counts.completed || 0);
  const failed = counts.failed || 0;

  return (
    <PageWrapper>
      <div className="stats-grid">
        <StatCard label="Total jobs" value={jobs.length} hint="Lesson-caption language records" />
        <StatCard label="Done" value={completed} hint="Ready for export" />
        <StatCard label="Failed" value={failed} hint="Retry without re-running successes" />
      </div>
      <RunControls
        selectedLanguages={selectedLanguages}
        onLanguagesChange={setSelectedLanguages}
        onStart={() => setPaused(false)}
        onRetry={() => setPaused(false)}
        paused={paused}
        onPauseToggle={() => setPaused((value) => !value)}
      />
      {error ? <p className="notice">Using local placeholder data: {error}</p> : null}
      {loading ? <Spinner /> : null}
      {!loading && jobs.length ? (
        <JobTable jobs={jobs} />
      ) : (
        <EmptyState title="No jobs yet" body="Create translation jobs from a course or lesson." />
      )}
    </PageWrapper>
  );
}
