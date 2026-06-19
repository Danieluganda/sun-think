import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Languages,
  MousePointerClick,
  Users,
  ExternalLink,
  KeyRound,
  Radio,
  ShieldCheck,
  Star,
  Trash2,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { getEmbedMappings, removeEmbedMapping, saveEmbedMapping } from "../api/embedMappings.js";
import { addProtectedTerm, getProtectedTerms, removeProtectedTerm } from "../api/protectedTerms.js";
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

function getActorLabel(event) {
  if (event.userEmail) return event.userEmail;
  if (event.visitorId) return event.visitorId;
  return "Anonymous visitor";
}

function WidgetActivity({ events }) {
  const recentEvents = events.slice(0, 6);

  return (
    <section className="dashboard-card table-wrap recent-events-card">
      <div className="panel-heading">
        <div>
          <h2>Translation Widget Users</h2>
          <p>Recent language button activity</p>
        </div>
      </div>
      <div className="recent-event-list">
        {recentEvents.map((event) => (
          <article className="recent-event-item" key={`${event.type}-${event.recordedAt}-${event.visitorId}`}>
            <div>
              <strong>{getActorLabel(event)}</strong>
              <small>{event.pageTitle || event.pageUrl || "Thinkific page"}</small>
            </div>
            <span>{formatDate(event.recordedAt)}</span>
            <Badge tone={event.status === "failure" ? "danger" : "success"}>{event.type}</Badge>
            <span>{event.targetLabel || event.targetLanguage || event.currentLanguage || "-"}</span>
          </article>
        ))}
      </div>
      {!recentEvents.length ? (
        <EmptyState title="No widget users yet" body="Open the language button on Thinkific to start collecting user activity." />
      ) : null}
    </section>
  );
}

function RecentApiEvents({ calls }) {
  return (
    <section className="dashboard-card table-wrap recent-events-card">
      <div className="panel-heading">
        <div>
          <h2>Recent API Events</h2>
          <p>Latest Thinkific and Sunbird calls</p>
        </div>
      </div>
      <div className="recent-event-list">
        {calls.map((call) => (
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
      {!calls.length ? (
        <EmptyState title="No API calls recorded yet" body="Run a course fetch or translation job to start collecting metrics." />
      ) : null}
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

function ProtectedTermsManager() {
  const [terms, setTerms] = useState([]);
  const [term, setTerm] = useState("");
  const [state, setState] = useState({ loading: true, saving: false, error: "" });

  useEffect(() => {
    let mounted = true;
    getProtectedTerms()
      .then((payload) => {
        if (!mounted) return;
        setTerms(payload.terms || []);
        setState({ loading: false, saving: false, error: "" });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({ loading: false, saving: false, error: error.message });
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    setState({ loading: false, saving: true, error: "" });
    try {
      const payload = await addProtectedTerm(cleanTerm);
      setTerms(payload.terms || []);
      setTerm("");
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({ loading: false, saving: false, error: error.message });
    }
  }

  async function handleRemove(value) {
    setState({ loading: false, saving: true, error: "" });
    try {
      const payload = await removeProtectedTerm(value);
      setTerms(payload.terms || []);
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({ loading: false, saving: false, error: error.message });
    }
  }

  return (
    <section className="dashboard-card protected-terms-card">
      <div className="panel-heading">
        <div>
          <h2>Do-Not-Translate Words</h2>
          <p>Protect names, brands, and phrases from widget translation.</p>
        </div>
      </div>
      <form className="protected-terms-form" onSubmit={handleAdd}>
        <label>
          Word or phrase
          <input
            placeholder="The 10X Program"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>
        <Button disabled={state.saving || !term.trim()} type="submit">
          Add
        </Button>
      </form>
      {state.loading ? <Spinner /> : null}
      {state.error ? <p className="notice">Protected terms unavailable: {state.error}</p> : null}
      <div className="protected-term-list">
        {terms.map((item) => (
          <span className="protected-term-chip" key={item}>
            {item}
            <button
              aria-label={`Remove ${item}`}
              disabled={state.saving}
              onClick={() => handleRemove(item)}
              type="button"
            >
              <Trash2 size={13} />
            </button>
          </span>
        ))}
      </div>
      {!state.loading && !terms.length ? (
        <EmptyState title="No protected words yet" body="Add names or brands that should stay unchanged." />
      ) : null}
    </section>
  );
}

function CacheStatus({ cache }) {
  const entries = cache?.entries || 0;
  const maxEntries = cache?.maxEntries || 0;
  const usedPercent = maxEntries ? Math.round((entries / maxEntries) * 100) : 0;

  return (
    <section className="dashboard-card cache-status-card">
      <div className="panel-heading">
        <div>
          <h2>Translation Cache</h2>
          <p>Cached text avoids repeated Sunbird calls.</p>
        </div>
        <Badge tone={entries ? "success" : "neutral"}>{entries} entries</Badge>
      </div>
      <div className="usage-meter">
        <div>
          <span>Cache capacity</span>
          <small>{entries} / {maxEntries || "unlimited"}</small>
        </div>
        <progress max="100" value={usedPercent} />
      </div>
      <p className="embed-note">
        Updated: {cache?.updatedAt ? formatDate(cache.updatedAt) : "Not warmed yet"}
      </p>
    </section>
  );
}

function EmbedMappingsManager() {
  const [mappings, setMappings] = useState([]);
  const [form, setForm] = useState({
    label: "Genially lesson",
    srcIncludes: "genially",
    lug: "",
    ach: "",
    teo: "",
    lgg: "",
    nyn: ""
  });
  const [state, setState] = useState({ loading: true, saving: false, error: "" });

  useEffect(() => {
    let mounted = true;
    getEmbedMappings()
      .then((payload) => {
        if (!mounted) return;
        setMappings(payload.mappings || []);
        setState({ loading: false, saving: false, error: "" });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({ loading: false, saving: false, error: error.message });
      });

    return () => {
      mounted = false;
    };
  }, []);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    const urls = {
      lug: form.lug,
      ach: form.ach,
      teo: form.teo,
      lgg: form.lgg,
      nyn: form.nyn
    };

    setState({ loading: false, saving: true, error: "" });
    try {
      const payload = await saveEmbedMapping({
        label: form.label,
        srcIncludes: form.srcIncludes,
        urls
      });
      setMappings(payload.mappings || []);
      setForm((current) => ({ ...current, lug: "", ach: "", teo: "", lgg: "", nyn: "" }));
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({ loading: false, saving: false, error: error.message });
    }
  }

  async function handleRemove(id) {
    setState({ loading: false, saving: true, error: "" });
    try {
      const payload = await removeEmbedMapping(id);
      setMappings(payload.mappings || []);
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({ loading: false, saving: false, error: error.message });
    }
  }

  return (
    <section className="dashboard-card embed-mappings-card">
      <div className="panel-heading">
        <div>
          <h2>Embedded Content URLs</h2>
          <p>Switch Genially or iframe content to translated versions.</p>
        </div>
      </div>
      <form className="embed-mapping-form" onSubmit={handleSave}>
        <label>
          Label
          <input value={form.label} onChange={(event) => updateForm("label", event.target.value)} />
        </label>
        <label>
          iframe src contains
          <input value={form.srcIncludes} onChange={(event) => updateForm("srcIncludes", event.target.value)} />
        </label>
        {["lug", "ach", "teo", "lgg", "nyn"].map((language) => (
          <label key={language}>
            {language.toUpperCase()} URL
            <input
              placeholder={`https://view.genial.ly/${language}-version`}
              value={form[language]}
              onChange={(event) => updateForm(language, event.target.value)}
            />
          </label>
        ))}
        <Button disabled={state.saving} type="submit">Save Embed URLs</Button>
      </form>
      {state.loading ? <Spinner /> : null}
      {state.error ? <p className="notice">Embed mappings unavailable: {state.error}</p> : null}
      <div className="embed-mapping-list">
        {mappings.map((mapping) => (
          <article className="embed-mapping-item" key={mapping.id}>
            <div>
              <strong>{mapping.label}</strong>
              <small>{mapping.srcIncludes || mapping.selector}</small>
            </div>
            <span>{Object.keys(mapping.urls || {}).join(", ") || "No languages"}</span>
            <button aria-label={`Remove ${mapping.label}`} disabled={state.saving} onClick={() => handleRemove(mapping.id)} type="button">
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
      {!state.loading && !mappings.length ? (
        <EmptyState title="No embedded URLs yet" body="Add translated Genially URLs before expecting cross-origin embeds to switch language." />
      ) : null}
    </section>
  );
}

export function MonitorPage({ onNavigate }) {
  const [activePanel, setActivePanel] = useState("activity");
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
  const widgetSummary = metrics.widgetSummary || {};
  const translationCache = metrics.translationCache || {};
  const panels = [
    { id: "activity", label: "Activity" },
    { id: "translation", label: "Translation Tools" },
    { id: "embeds", label: "Embedded Content" },
    { id: "admin", label: "Admin" }
  ];

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
        <StatCard icon={Users} label="Widget Visitors" value={widgetSummary.uniqueVisitors || 0} hint={`${widgetSummary.identifiedUsers || 0} identified`} tone="green" />
        <StatCard icon={MousePointerClick} label="Widget Actions" value={widgetSummary.totalEvents || 0} hint="Language button events" tone="blue" />
        <StatCard icon={Languages} label="Language Picks" value={widgetSummary.languageSelections || 0} hint={`${widgetSummary.completedTranslations || 0} completed`} tone="purple" />
      </div>

      {error ? <p className="notice">Metrics unavailable: {error}</p> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <>
        <div className="dashboard-overview-grid">
          <RequestChart calls={metrics.recentCalls} />
          <div className="dashboard-side-stack">
            <ApiHealthList apis={metrics.apis} />
            <CacheStatus cache={translationCache} />
            <DeliveryStatus totalCalls={totalCalls} success={success} failures={failures} />
          </div>
        </div>

        <section className="dashboard-card dashboard-tabs-card">
          <div className="dashboard-tabs-header">
            <div>
              <h2>Operations</h2>
              <p>Review activity and manage translation controls.</p>
            </div>
            <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
              {panels.map((panel) => (
                <button
                  aria-selected={activePanel === panel.id}
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  role="tab"
                  type="button"
                >
                  {panel.label}
                </button>
              ))}
            </div>
          </div>

          {activePanel === "activity" ? (
            <div className="dashboard-tab-grid">
              <RecentApiEvents calls={recentCalls} />
              <WidgetActivity events={metrics.recentWidgetEvents || []} />
            </div>
          ) : null}

          {activePanel === "translation" ? (
            <div className="dashboard-tab-grid">
              <TranslationTest />
              <ProtectedTermsManager />
            </div>
          ) : null}

          {activePanel === "embeds" ? (
            <div className="dashboard-tab-grid single">
              <EmbedMappingsManager />
            </div>
          ) : null}

          {activePanel === "admin" ? (
            <div className="dashboard-tab-grid">
              <UsageOverview totalCalls={totalCalls} success={success} failures={failures} onNavigate={onNavigate} />
              <QuickLinks onNavigate={onNavigate} />
            </div>
          ) : null}
        </section>
        </>
      ) : null}
    </PageWrapper>
  );
}
