import { downloadCsv, downloadJson } from "../../api/export.js";
import { learnerUrl } from "../../utils/constants.js";
import { DownloadCard } from "./DownloadCard.jsx";

function saveText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkExport() {
  return (
    <div className="download-grid">
      <DownloadCard
        title="Jobs JSON"
        description="Full job metadata for reporting or re-import."
        onDownload={async () => saveText("jobs.json", await downloadJson(), "application/json")}
      />
      <DownloadCard
        title="Jobs CSV"
        description="Spreadsheet-friendly export for operations review."
        onDownload={async () => saveText("jobs.csv", await downloadCsv(), "text/csv")}
      />
      <DownloadCard
        title="Learner site"
        description="Open the academy site to compare course names and learner-facing structure."
        onDownload={() => window.open(learnerUrl, "_blank", "noopener,noreferrer")}
      />
    </div>
  );
}
