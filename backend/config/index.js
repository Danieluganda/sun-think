import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

function resolveFromRoot(value, fallback) {
  const raw = value || fallback;
  return path.isAbsolute(raw) ? raw : path.resolve(backendRoot, raw);
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4100),
  apiToken: process.env.API_TOKEN || "",
  thinkific: {
    graphqlUrl:
      process.env.THINKIFIC_GRAPHQL_URL ||
      process.env.THINKIFIC_API_URL ||
      "https://api.thinkific.com/stable/graphql",
    token: process.env.THINKIFIC_TOKEN || process.env.THINKIFIC_ACCESS_TOKEN || ""
  },
  sunbird: {
    apiUrl: (process.env.SUNBIRD_API_URL || "https://api.sunbird.ai/tasks/translate").trim(),
    key: process.env.SUNBIRD_API_KEY || process.env.SUNBIRD_KEY || ""
  },
  dbPath: resolveFromRoot(process.env.DB_PATH, "./data/jobs.db"),
  widgetAnalyticsPath: resolveFromRoot(process.env.WIDGET_ANALYTICS_PATH, "./data/widget-analytics.json"),
  translationCachePath: resolveFromRoot(process.env.TRANSLATION_CACHE_PATH, "./data/translation-cache.json"),
  outputDir: resolveFromRoot(process.env.OUTPUT_DIR, "./output"),
  logDir: resolveFromRoot(process.env.LOG_DIR, "./logs")
};

export function validateConfig({ requireSecrets = false } = {}) {
  const missing = [];

  if (!config.port || Number.isNaN(config.port)) missing.push("PORT");
  if (requireSecrets && !config.thinkific.token) missing.push("THINKIFIC_TOKEN or THINKIFIC_ACCESS_TOKEN");
  if (requireSecrets && !config.sunbird.key) missing.push("SUNBIRD_API_KEY");
  if (requireSecrets && !config.sunbird.apiUrl) missing.push("SUNBIRD_API_URL");

  if (missing.length) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }

  return config;
}
