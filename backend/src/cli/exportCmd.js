import { exportJobsCsv } from "../export/csv.js";
import { exportJobsJson } from "../export/json.js";

export async function exportCommand(args) {
  const format = args[0] || "json";
  if (format === "csv") {
    console.log(await exportJobsCsv());
    return;
  }
  console.log(await exportJobsJson());
}
