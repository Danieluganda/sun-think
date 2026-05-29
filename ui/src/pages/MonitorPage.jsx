import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  Radio,
  ShieldCheck,
  Star,
  Zap
} from "lucide-react";
import { useState } from "react";
import { testTranslation } from "../api/translate.js";
import { Badge } from "../components/common/Badge.jsx";
import { Button } from "../components/common/Button.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Spinner } from "../components/common/Spinner.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { PageWrapper } from "../components/layout/PageWrapper.jsx";
import { useLanguages } from "../hooks/useLanguages.js";
import { useMetrics } from "../hooks/useMetrics.js";
import { formatDate } from "../utils/formatters.js";

function formatMs(value) {
  if (!value) return "0 ms";
  return `${Math.round(value)} ms`;
}

function getSuccessRate(api) {
  if (!api.total) return "0%";
  return `${Math.round((api.success / api.total) * 100)}%`;
}

function getStatusTone(status) {
  if (status === "healthy") return "success";
  if (status === "failing") return "danger";
  return "neutral";
}

function getApiTitle(name) {
  return name === "sunbird" ? "Sunbird Translation API" : "Thinkific GraphQL API";
}

function buildChartPoints(calls) {
  const base = calls.length ? calls.slice(0, 7).reverse() : [];
  const values = base.length
    ? base.map((call, index) => ({ label: `${index + 1}`, value: Math.max(1, call.durationMs) }))
    : [
        { label: "12", value: 24 },
        { label: "13", value: 58 },
        { label: "14", value: 36 },
        { label: "15", value: 62 },
        { label: "16", value: 50 },
        { label: "17", value: 74 },
        { label: "18", value: 82 }
      ];
  const max = Math.max(...values.map((item) => item.value), 1);

  return values.map((item, index) => {
    const x = 30 + index * (720 / Math.max(values.length - 1, 1));
    const y = 150 - (item.value / max) * 110;
    return { ...item, x, y };
  });
}

function RequestChart({ calls }) {
  const points = buildChartPoints(calls);
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points.at(-1).x} 165 L ${points[0].x} 165 Z`;

  return (
    <section className="dashboard-card request-chart-card">
      <div className="panel-heading">
        <div>
          <h2>Request Activity</h2>
          <p>Last 7 events</p>
        </div>
        <select aria-label="Chart range" defaultValue="7">
          <option value="7">Last 7 events</option>
          <option value="25">Last 25 events</option>
        </select>
      </div>
      <svg className="request-chart" viewBox="0 0 800 190" role="img" aria-label="API request activity chart">
        <g className="chart-grid">
          {[40, 80, 120, 160].map((y) => (
            <line key={y} x1="30" x2="770" y1={y} y2={y} />
          ))}
        </g>
        <path className="chart-area" d={area} />
        <path className="chart-line" d={path} />
        {points.map((point) => (
          <circle className="chart-dot" cx={point.x} cy={point.y} key={`${point.label}-${point.x}`} r="4" />
        ))}
        {points.map((point) => (
          <text className="chart-label" key={`label-${point.label}`} x={point.x} y="184">
            {point.label}
          </text>
        ))}
      </svg>
    </section>
  );
}

function DeliveryStatus({ totalCalls, success, failures }) {
  const pending = Math.max(totalCalls - success - failures, 0);
  const successRate = totalCalls ? Math.round((success / totalCalls) * 100) : 0;

  return (
    <section className="dashboard-card delivery-card">
      <h2>API Delivery Status</h2>
      <div className="donut-row">
        <div className="donut" style={{ "--success": `${successRate}%` }}>
          <strong>{totalCalls}</strong>
          <span>Total</span>
        </div>
        <div className="legend-list">
          <span>
            <i className="legend green" />
            Successful {success}
          </span>
          <span>
            <i className="legend red" />
            Failed {failures}
          </span>
          <span>
            <i className="legend amber" />
            Pending {pending}
          </span>
        </div>
      </div>
    </section>
  );
}

function ApiHealthList({ apis }) {
  return (
    <section className="dashboard-card api-status-card">
      <h2>Environment Status</h2>
      <div className="environment-stack">
        {apis.map((api) => (
          <article className={`environment-status ${api.lastStatus}`} key={api.name}>
            <div>
              <strong>{api.name.toUpperCase()}</strong>
              <span>{getApiTitle(api.name)}</span>
            </div>
            <Badge tone={getStatusTone(api.lastStatus)}>{api.lastStatus}</Badge>
          </article>
        ))}
        {!apis.length ? (
          <article className="environment-status idle">
            <div>
              <strong>SANDBOX</strong>
              <span>Waiting for first API request</span>
            </div>
            <Badge>idle</Badge>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function UsageOverview({ totalCalls, success, failures, onNavigate }) {
  const successRate = totalCalls ? Math.round((success / totalCalls) * 100) : 0;
  const failureRate = totalCalls ? Math.round((failures / totalCalls) * 100) : 0;

  return (
    <section className="dashboard-card usage-card">
      <h2>API Usage Overview</h2>
      <div className="usage-meter">
        <div>
          <span>Rate Limit</span>
          <small>{Math.min(totalCalls, 1000)} / 1,000</small>
        </div>
        <progress max="1000" value={Math.min(totalCalls, 1000)} />
      </div>
      <div className="usage-meter">
        <div>
          <span>Success Rate</span>
          <small>{successRate}%</small>
        </div>
        <progress className="blue" max="100" value={successRate} />
      </div>
      <div className="usage-meter">
        <div>
          <span>Failure Rate</span>
          <small>{failureRate}%</small>
        </div>
        <progress className="amber" max="100" value={failureRate} />
      </div>
      <button type="button" onClick={() => onNavigate("logs")}>View detailed metrics &rarr;</button>
    </section>
  );
}

function QuickLinks({ onNavigate }) {
  const links = [
    { icon: KeyRound, title: "API Keys", body: "Manage credentials", page: "api-keys" },
    { icon: ShieldCheck, title: "Webhook Setup", body: "Configure Thinkific events", page: "webhooks" },
    { icon: ExternalLink, title: "API Documentation", body: "Review request formats", page: "docs" }
  ];

  return (
    <section className="dashboard-card quick-links-card">
      <h2>Quick Links</h2>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button type="button" onClick={() => onNavigate(link.page)} key={link.title}>
            <span>
              <Icon size={16} />
            </span>
            <strong>{link.title}</strong>
            <small>{link.body}</small>
            <ExternalLink size={14} />
          </button>
        );
      })}
    </section>
  );
}

function TranslationTest() {
  const { sourceLanguage, targetLanguages, loading: languagesLoading, error: languagesError } = useLanguages();
  const [text, setText] = useState("Welcome to the course.");
  const [targetLanguage, setTargetLanguage] = useState(targetLanguages[0]?.code || "lug");
  const [state, setState] = useState({ loading: false, result: "", error: "" });
  const selectedLanguage = targetLanguages.some((language) => language.code === targetLanguage)
    ? targetLanguage
    : targetLanguages[0]?.code || "lug";

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setState({ loading: false, result: "", error: "Enter text to translate." });
      return;
    }

    setState({ loading: true, result: "", error: "" });
    try {
      const payload = await testTranslation({
        text: cleanText,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: selectedLanguage
      });
      setState({ loading: false, result: payload.translations?.[0] || "", error: "" });
    } catch (error) {
      setState({ loading: false, result: "", error: error.message });
    }
  }

  return (
    <section className="dashboard-card translation-test-card">
      <div className="panel-heading">
        <div>
          <h2>Quick Translation Test</h2>
          <p>Send one short sentence through Sunbird.</p>
        </div>
      </div>
      <form className="translation-test-form" onSubmit={handleSubmit}>
        <label>
          Sample text
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows="4" />
        </label>
        <div className="translation-test-actions">
          <label>
            Target language
            <select value={selectedLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
              {targetLanguages.map((language) => (
                <option value={language.code} key={language.code}>
                  {language.name} ({language.code})
                </option>
              ))}
            </select>
          </label>
          <Button icon={Zap} disabled={state.loading || languagesLoading} type="submit">
            {state.loading ? "Testing..." : "Test Translation"}
          </Button>
        </div>
      </form>
      {languagesError ? <p className="notice">Using fallback languages: {languagesError}</p> : null}
      {state.result ? (
        <div className="translation-result">
          <span>Result</span>
          <p>{state.result}</p>
        </div>
      ) : null}
      {state.error ? <p className="notice">Translation test failed: {state.error}</p> : null}
    </section>
  );
}

export function MonitorPage({ onNavigate }) {
  const { metrics, loading, error } = useMetrics({ pollMs: 5000 });
  const recentCalls = metrics.recentCalls.slice(0, 5);
  const totalCalls = metrics.apis.reduce((sum, api) => sum + api.total, 0);
  const success = metrics.apis.reduce((sum, api) => sum + api.success, 0);
  const failures = metrics.apis.reduce((sum, api) => sum + api.failure, 0);
  const activeApis = metrics.apis.filter((api) => api.lastStatus === "healthy").length;
  const avgDuration = metrics.apis.length
    ? metrics.apis.reduce((sum, api) => sum + api.averageDurationMs, 0) / metrics.apis.length
    : 0;
  const successRate = totalCalls ? Math.round((success / totalCalls) * 100) : 0;

  return (
    <PageWrapper>
      <div className="dashboard-title">
        <h1>API Dashboard</h1>
        <p>Real-time overview of Thinkific integration and Sunbird translation activity.</p>
      </div>

      <div className="stats-grid dashboard-stats">
        <StatCard icon={Star} label="Total Requests" value={totalCalls} hint="Across both APIs" tone="green" />
        <StatCard icon={CheckCircle2} label="Successful Requests" value={success} hint={`${successRate}% success rate`} tone="blue" />
        <StatCard icon={Zap} label="Average Response" value={formatMs(avgDuration)} hint="Current process memory" tone="purple" />
        <StatCard icon={AlertTriangle} label="Failed Requests" value={failures} hint="Requests needing attention" tone="amber" />
        <StatCard icon={Radio} label="Active APIs" value={activeApis} hint={`${metrics.apis.length} monitored`} tone="cyan" />
      </div>

      {error ? <p className="notice">Metrics unavailable: {error}</p> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <div className="dashboard-grid">
          <RequestChart calls={metrics.recentCalls} />
          <DeliveryStatus totalCalls={totalCalls} success={success} failures={failures} />
          <ApiHealthList apis={metrics.apis} />

          <section className="dashboard-card table-wrap recent-events-card">
            <div className="panel-heading">
              <div>
                <h2>Recent API Events</h2>
                <p>Latest Thinkific and Sunbird calls</p>
              </div>
            </div>
            <div className="recent-event-list">
              {recentCalls.map((call) => (
                <article className="recent-event-item" key={`${call.api}-${call.time}-${call.durationMs}`}>
                  <div>
                    <strong>{call.api}</strong>
                    <small>{getApiTitle(call.api)}</small>
                  </div>
                  <span>{formatDate(call.time)}</span>
                  <Badge tone={call.ok ? "success" : "danger"}>{call.ok ? "success" : "failed"}</Badge>
                  <span>{formatMs(call.durationMs)}</span>
                </article>
              ))}
            </div>
            {!recentCalls.length ? (
              <EmptyState title="No API calls recorded yet" body="Run a course fetch or translation job to start collecting metrics." />
            ) : null}
          </section>
          <TranslationTest />
          <UsageOverview totalCalls={totalCalls} success={success} failures={failures} onNavigate={onNavigate} />
          <QuickLinks onNavigate={onNavigate} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
