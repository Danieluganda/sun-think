import { apiRequest } from "./client.js";

export function getProtectedTerms() {
  return apiRequest("/protected-terms");
}

export function addProtectedTerm(term) {
  return apiRequest("/protected-terms", {
    method: "POST",
    body: JSON.stringify({ term })
  });
}

export function removeProtectedTerm(term) {
  return apiRequest("/protected-terms", {
    method: "DELETE",
    body: JSON.stringify({ term })
  });
}
