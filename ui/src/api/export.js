import { apiRequest } from "./client.js";

export function downloadJson() {
  return apiRequest("/export/json");
}

export function downloadCsv() {
  return apiRequest("/export/csv", {
    headers: { Accept: "text/csv" }
  });
}
