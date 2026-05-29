import { apiRequest } from "./client.js";

export function getLanguages() {
  return apiRequest("/languages");
}
