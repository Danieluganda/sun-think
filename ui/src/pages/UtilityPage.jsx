import { Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/common/Badge.jsx";
import { Button } from "../components/common/Button.jsx";
import { PageWrapper } from "../components/layout/PageWrapper.jsx";
import { useLanguages } from "../hooks/useLanguages.js";

const pageContent = {
  "api-keys": {
    eyebrow: "Integration",
    title: "API Keys",
    body: "Use these environment keys to connect the dashboard to Thinkific and Sunbird securely.",
    rows: [
      ["Thinkific token", "THINKIFIC_TOKEN or THINKIFIC_ACCESS_TOKEN", "Backend only"],
      ["Sunbird key", "SUNBIRD_API_KEY", "Backend only"],
      ["Dashboard token", "VITE_API_TOKEN", "Browser client"]
    ],
    action: "Open backend README"
  },
  webhooks: {
    eyebrow: "Integration",
    title: "Webhooks",
    body: "Webhook setup is where Thinkific events can be connected to background translation jobs.",
    rows: [
      ["Course updated", "Prepare captions for translation", "Planned"],
      ["Lesson updated", "Refresh lesson metadata", "Planned"],
      ["Caption uploaded", "Create translation jobs", "Planned"]
    ],
    action: "View jobs"
  },
  logs: {
    eyebrow: "Integration",
    title: "Logs",
    body: "Operational logs are written by the backend logger and recent API events are visible in the monitor.",
    rows: [
      ["Backend service", "Structured JSON logs", "Active"],
      ["API metrics", "In-memory process metrics", "Active"],
      ["Persistent history", "Database-backed reporting", "Next step"]
    ],
    action: "View monitor"
  },
  docs: {
    eyebrow: "Developer",
    title: "API Documentation",
    body: "These are the internal dashboard endpoints currently available from the backend.",
    rows: [
      ["GET /health", "Backend health check", "Public"],
      ["GET /api/metrics", "API usage monitor", "Protected"],
      ["GET /api/jobs", "Translation jobs", "Protected"]
    ],
    action: "View API keys"
  },
  settings: {
    eyebrow: "Settings",
    title: "Dashboard Settings",
    body: "Configuration currently comes from environment variables so secrets stay outside the UI build.",
    rows: [
      ["API base URL", "VITE_API_BASE_URL", "Frontend"],
      ["Server port", "PORT", "Backend"],
      ["Storage path", "DB_PATH", "Backend"]
    ],
    action: "Open export"
  },
  support: {
    eyebrow: "Support",
    title: "Support",
    body: "Use this checklist when the integration needs attention.",
    rows: [
      ["Thinkific failing", "Check token and GraphQL URL", "Action"],
      ["Sunbird failing", "Check API key and translate URL", "Action"],
      ["No metrics", "Run a fetch or translation job", "Action"]
    ],
    action: "View monitor"
  }
};

const actionTargets = {
  "Open backend README": "docs",
  "View jobs": "jobs",
  "View monitor": "monitor",
  "View API keys": "api-keys",
  "Open export": "export"
};

function getDefaultBackendUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4100/api";
  return apiBase.replace(/\/api\/?$/, "");
}

function buildThinkificSnippet(backendUrl, sourceLanguage) {
  const cleanUrl = backendUrl.replace(/\/$/, "");

  return `<script>
  window.THINKIFIC_SUNBIRD_SOURCE_LANGUAGE = "${sourceLanguage.code}";
</script>
<script src="${cleanUrl}/widget/language-switcher.js" defer></script>`;
}

function ThinkificEmbedCode() {
  const { sourceLanguage, targetLanguages, loading, error } = useLanguages();
  const [backendUrl, setBackendUrl] = useState(getDefaultBackendUrl());
  const [copied, setCopied] = useState(false);
  const snippet = useMemo(
    () => buildThinkificSnippet(backendUrl, sourceLanguage),
    [backendUrl, sourceLanguage]
  );

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="dashboard-card embed-card">
      <div className="panel-heading">
        <div>
          <h2>Thinkific Button Code</h2>
          <p>Paste this into Thinkific custom code to show the language switcher.</p>
        </div>
        <Button icon={copied ? Check : Copy} onClick={copySnippet}>
          {copied ? "Copied" : "Copy Code"}
        </Button>
      </div>
      <label className="embed-url-field">
        Backend public URL
        <input value={backendUrl} onChange={(event) => setBackendUrl(event.target.value)} />
      </label>
      <div className="embed-language-summary">
        <Badge tone="info">{loading ? "Loading languages" : `${targetLanguages.length + 1} languages`}</Badge>
        {error ? <span>Using fallback languages: {error}</span> : <span>Languages are loaded from the backend.</span>}
      </div>
      <pre className="embed-code"><code>{snippet}</code></pre>
      <p className="embed-note">
        For live Thinkific pages, replace localhost with the deployed backend domain.
      </p>
    </section>
  );
}

export function UtilityPage({ pageId, onNavigate }) {
  const content = pageContent[pageId] || pageContent.docs;

  return (
    <PageWrapper>
      <div className="dashboard-title">
        <span className="eyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
      </div>

      <section className="dashboard-card utility-card">
        <div className="panel-heading">
          <div>
            <h2>{content.title} Details</h2>
            <p>Current working setup for this dashboard.</p>
          </div>
          <Button icon={ExternalLink} onClick={() => onNavigate(actionTargets[content.action])}>
            {content.action}
          </Button>
        </div>
        <div className="utility-list">
          {content.rows.map(([name, detail, status]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <span>{detail}</span>
              </div>
              <Badge tone={status === "Active" ? "success" : status === "Planned" ? "warning" : "neutral"}>
                {status}
              </Badge>
            </article>
          ))}
        </div>
      </section>

      {pageId === "docs" ? <ThinkificEmbedCode /> : null}
    </PageWrapper>
  );
}
