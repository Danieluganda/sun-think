import { apiRequest } from "./client.js";

export function getEmbedMappings() {
  return apiRequest("/embed-mappings");
}

export function saveEmbedMapping(mapping) {
  return apiRequest("/embed-mappings", {
    method: "POST",
    body: JSON.stringify(mapping)
  });
}

export function removeEmbedMapping(id) {
  return apiRequest(`/embed-mappings/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
