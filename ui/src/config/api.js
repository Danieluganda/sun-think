export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return import.meta.env.PROD ? "/api" : "http://localhost:4100/api";
}
