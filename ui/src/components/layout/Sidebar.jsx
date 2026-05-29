import {
  Activity,
  BookOpen,
  Briefcase,
  Code2,
  Download,
  FileClock,
  HelpCircle,
  KeyRound,
  ListVideo,
  Settings,
  Webhook
} from "lucide-react";
import { navItems } from "../../utils/constants.js";

const icons = {
  monitor: Activity,
  courses: BookOpen,
  lessons: ListVideo,
  jobs: Briefcase,
  export: Download,
  "api-keys": KeyRound,
  webhooks: Webhook,
  logs: FileClock,
  docs: Code2,
  settings: Settings
};

const groupedItems = [
  { label: "Overview", items: navItems },
  {
    label: "Integration",
    items: [
      { id: "api-keys", label: "API Keys", icon: KeyRound },
      { id: "webhooks", label: "Webhooks", icon: Webhook },
      { id: "logs", label: "Logs", icon: FileClock }
    ]
  },
  {
    label: "Developer",
    items: [
      { id: "docs", label: "API Documentation", icon: Code2 },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  }
];

export function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <span>Sunbird Hub</span>
        <small>API</small>
      </div>
      <div className="environment-pill">
        <span className="status-dot" />
        SANDBOX - Active
      </div>
      <nav className="nav-list">
        {groupedItems.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon || icons[item.id];
              return (
                <button
                  className={`nav-item ${activePage === item.id ? "active" : ""}`}
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="help-card">
        <HelpCircle size={18} />
        <strong>Need Help?</strong>
        <span>Our support team is here</span>
        <button type="button" onClick={() => onNavigate("support")}>Contact Support &rarr;</button>
      </div>
    </aside>
  );
}
