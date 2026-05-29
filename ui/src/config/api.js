export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return import.meta.env.PROD
    ? "https://sun-think-api.onrender.com/api"
    : "http://localhost:4100/api";
}
