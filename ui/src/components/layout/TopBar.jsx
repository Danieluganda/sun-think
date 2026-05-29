import { Bell, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "../common/Button.jsx";

export function TopBar({ title, onNavigate }) {
  return (
    <header className="topbar">
      <nav className="topbar-links" aria-label="Support links">
        <button type="button" onClick={() => onNavigate("docs")}>API Docs</button>
        <button type="button" onClick={() => onNavigate("monitor")}>
          <span className="status-dot" />
          Status
        </button>
        <button type="button" onClick={() => onNavigate("support")}>Support</button>
      </nav>
      <div className="topbar-actions">
        <button className="icon-button" title="Refresh" type="button" onClick={() => window.location.reload()}>
          <RefreshCw size={18} />
        </button>
        <button className="icon-button notification-button" title="Notifications" type="button" onClick={() => onNavigate("logs")}>
          <Bell size={18} />
          <span>2</span>
        </button>
        <button className="account-switcher" type="button" onClick={() => onNavigate("settings")}>
          <span className="avatar">TS</span>
          <span>
            <strong>Sunbird Admin</strong>
            <small>{title}</small>
          </span>
        </button>
        <Button icon={KeyRound} onClick={() => onNavigate("api-keys")}>View API Keys</Button>
      </div>
    </header>
  );
}
