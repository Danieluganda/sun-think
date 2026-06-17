const counters = new Map();
const apiStats = new Map();
const recentCalls = [];
const maxRecentCalls = 25;
const recentWidgetEvents = [];
const maxRecentWidgetEvents = 100;

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

  recentWidgetEvents.unshift({
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
    nodeCount: Number(event?.nodeCount || 0),
    translatedCount: Number(event?.translatedCount || 0),
    durationMs: Number(event?.durationMs || 0),
    status: String(event?.status || "").slice(0, 40),
    error: String(event?.error || "").slice(0, 300),
    userAgent: String(event?.userAgent || "").slice(0, 300),
    viewport: event?.viewport || null
  });

  recentWidgetEvents.splice(maxRecentWidgetEvents);
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
  return {
    counters: Object.fromEntries(counters.entries()),
    apis: Array.from(apiStats.values()).map(({ totalDurationMs, ...stat }) => stat),
    recentCalls: [...recentCalls],
    recentWidgetEvents: [...recentWidgetEvents]
  };
}
