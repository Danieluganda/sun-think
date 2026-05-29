const counters = new Map();
const apiStats = new Map();
const recentCalls = [];
const maxRecentCalls = 25;

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
    recentCalls: [...recentCalls]
  };
}
