import { apiRequest } from "./client.js";

export function getMetrics() {
  return apiRequest("/metrics");
}
