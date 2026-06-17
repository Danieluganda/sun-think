import fs from "node:fs";
import path from "node:path";
import { config } from "../../config/index.js";

const counters = new Map();
const apiStats = new Map();
const recentCalls = [];
const maxRecentCalls = 25;
const recentWidgetEvents = [];
const maxRecentWidgetEvents = 100;
const maxStoredWidgetEvents = Number(process.env.WIDGET_ANALYTICS_MAX_EVENTS || 5000);
const widgetAnalytics = loadWidgetAnalytics();

function createEmptyWidgetAnalytics() {
  return {
    version: 1,
    updatedAt: null,
    totals: {
      totalEvents: 0,
      languageSelections: 0,
      completedTranslations: 0,
      failedTranslations: 0
    },
    visitors: {},
    users: {},
    languages: {},
    events: []
  };
}

function loadWidgetAnalytics() {
  try {
    if (!fs.existsSync(config.widgetAnalyticsPath)) {
      return createEmptyWidgetAnalytics();
    }

    const parsed = JSON.parse(fs.readFileSync(config.widgetAnalyticsPath, "utf8"));
    const analytics = { ...createEmptyWidgetAnalytics(), ...parsed };
    analytics.totals = { ...createEmptyWidgetAnalytics().totals, ...(parsed.totals || {}) };
    analytics.visitors = parsed.visitors || {};
    analytics.users = parsed.users || {};
    analytics.languages = parsed.languages || {};
    analytics.events = Array.isArray(parsed.events) ? parsed.events.slice(0, maxStoredWidgetEvents) : [];
    recentWidgetEvents.unshift(...analytics.events.slice(0, maxRecentWidgetEvents));
    return analytics;
  } catch {
    return createEmptyWidgetAnalytics();
  }
}

function saveWidgetAnalytics() {
  try {
    fs.mkdirSync(path.dirname(config.widgetAnalyticsPath), { recursive: true });
    const tempPath = `${config.widgetAnalyticsPath}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(widgetAnalytics, null, 2)}\n`);
    fs.renameSync(tempPath, config.widgetAnalyticsPath);
  } catch {
    // Analytics should never block learner-facing translation requests.
  }
}

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function incrementObjectCount(object, key, amount = 1) {
  if (!key) return;
  object[key] = (object[key] || 0) + amount;
}

function updateVisitorStats(event) {
  if (!event.visitorId) return;

  const existing = widgetAnalytics.visitors[event.visitorId] || {
    firstSeenAt: event.recordedAt,
    lastSeenAt: event.recordedAt,
    userEmail: "",
    eventCount: 0,
    languageSelections: 0,
    completedTranslations: 0,
    failedTranslations: 0,
    languages: {},
    pages: {}
  };

  existing.lastSeenAt = event.recordedAt;
  existing.userEmail = event.userEmail || existing.userEmail;
  existing.eventCount += 1;
  if (event.type === "Language Selected") existing.languageSelections += 1;
  if (event.type === "Translation Completed") existing.completedTranslations += 1;
  if (event.type === "Translation Failed" || event.status === "failure") existing.failedTranslations += 1;
  incrementObjectCount(existing.languages, event.targetLabel || event.targetLanguage || event.currentLanguage);
  incrementObjectCount(existing.pages, event.pageUrl);

  widgetAnalytics.visitors[event.visitorId] = existing;
}

function updateUserStats(event) {
  if (!event.userEmail) return;

  const existing = widgetAnalytics.users[event.userEmail] || {
    firstSeenAt: event.recordedAt,
    lastSeenAt: event.recordedAt,
    visitorIds: [],
    eventCount: 0,
    languages: {}
  };

  existing.lastSeenAt = event.recordedAt;
  existing.eventCount += 1;
  if (event.visitorId && !existing.visitorIds.includes(event.visitorId)) {
    existing.visitorIds.push(event.visitorId);
  }
  incrementObjectCount(existing.languages, event.targetLabel || event.targetLanguage || event.currentLanguage);

  widgetAnalytics.users[event.userEmail] = existing;
}

function createApiStat(name) {
  return {
    name,
    total: 0,
    success: 0,
    failure: 0,
    totalDurationMs: 0,
    averageDurationMs: 0,
    lastStatus: "idle",
    lastStatusCode: null,
    lastRunAt: null,
    lastError: ""
  };
}

export function incrementMetric(name, amount = 1) {
  counters.set(name, (counters.get(name) || 0) + amount);
}

export function recordApiCall({ api, ok, durationMs, statusCode = null, error = "" }) {
  const stat = apiStats.get(api) || createApiStat(api);
  stat.total += 1;
  stat.totalDurationMs += durationMs;
  stat.averageDurationMs = Math.round(stat.totalDurationMs / stat.total);
  stat.lastStatus = ok ? "healthy" : "failing";
  stat.lastStatusCode = statusCode;
  stat.lastRunAt = new Date().toISOString();
  stat.lastError = ok ? "" : error;

  if (ok) stat.success += 1;
  else stat.failure += 1;

  apiStats.set(api, stat);
  recentCalls.unshift({
    api,
    ok,
    durationMs,
    statusCode,
    error,
    time: stat.lastRunAt
  });
  recentCalls.splice(maxRecentCalls);
}

export function recordWidgetEvent(event) {
  const recordedAt = new Date().toISOString();
  const type = String(event?.type || "unknown").slice(0, 80);

  incrementMetric(`widget.${type}`);

  const widgetEvent = {
    type,
    recordedAt,
    visitorId: String(event?.visitorId || "").slice(0, 120),
    userEmail: String(event?.userEmail || "").slice(0, 180),
    sourceLanguage: String(event?.sourceLanguage || "").slice(0, 20),
    targetLanguage: String(event?.targetLanguage || "").slice(0, 20),
    targetLabel: String(event?.targetLabel || "").slice(0, 80),
    currentLanguage: String(event?.currentLanguage || "").slice(0, 20),
    pageTitle: String(event?.pageTitle || "").slice(0, 220),
    pageUrl: String(event?.pageUrl || "").slice(0, 600),
    referrer: String(event?.referrer || "").slice(0, 600),
    nodeCount: safeNumber(event?.nodeCount),
    translatedCount: safeNumber(event?.translatedCount),
    durationMs: safeNumber(event?.durationMs),
    status: String(event?.status || "").slice(0, 40),
    error: String(event?.error || "").slice(0, 300),
    userAgent: String(event?.userAgent || "").slice(0, 300),
    viewport: event?.viewport || null
  };

  recentWidgetEvents.unshift(widgetEvent);

  recentWidgetEvents.splice(maxRecentWidgetEvents);

  widgetAnalytics.updatedAt = recordedAt;
  widgetAnalytics.totals.totalEvents += 1;
  if (type === "Language Selected") widgetAnalytics.totals.languageSelections += 1;
  if (type === "Translation Completed") widgetAnalytics.totals.completedTranslations += 1;
  if (type === "Translation Failed" || widgetEvent.status === "failure") widgetAnalytics.totals.failedTranslations += 1;
  incrementObjectCount(widgetAnalytics.languages, widgetEvent.targetLabel || widgetEvent.targetLanguage || widgetEvent.currentLanguage);
  updateVisitorStats(widgetEvent);
  updateUserStats(widgetEvent);
  widgetAnalytics.events.unshift(widgetEvent);
  widgetAnalytics.events.splice(maxStoredWidgetEvents);
  saveWidgetAnalytics();
}

export async function trackApiCall(api, task) {
  const startedAt = Date.now();

  try {
    const result = await task();
    recordApiCall({
      api,
      ok: true,
      durationMs: Date.now() - startedAt,
      statusCode: result?.statusCode ?? null
    });
    return result?.value ?? result;
  } catch (error) {
    recordApiCall({
      api,
      ok: false,
      durationMs: Date.now() - startedAt,
      statusCode: error.statusCode ?? null,
      error: error.message
    });
    throw error;
  }
}

export function getMetrics() {
  const uniqueVisitors = Object.keys(widgetAnalytics.visitors).length;
  const identifiedUsers = Object.keys(widgetAnalytics.users).length;

  return {
    counters: Object.fromEntries(counters.entries()),
    apis: Array.from(apiStats.values()).map(({ totalDurationMs, ...stat }) => stat),
    recentCalls: [...recentCalls],
    recentWidgetEvents: [...recentWidgetEvents],
    widgetSummary: {
      totalEvents: widgetAnalytics.totals.totalEvents,
      uniqueVisitors,
      identifiedUsers,
      languageSelections: widgetAnalytics.totals.languageSelections,
      completedTranslations: widgetAnalytics.totals.completedTranslations,
      failedTranslations: widgetAnalytics.totals.failedTranslations,
      topLanguages: Object.entries(widgetAnalytics.languages)
        .map(([language, count]) => ({ language, count }))
        .sort((first, second) => second.count - first.count)
        .slice(0, 8),
      storedEvents: widgetAnalytics.events.length,
      storagePath: config.widgetAnalyticsPath,
      updatedAt: widgetAnalytics.updatedAt
    }
  };
}
