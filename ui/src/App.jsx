import { Activity, BookOpen, Briefcase, Code2, Download, FileClock, KeyRound, LifeBuoy, ListVideo, Settings, Webhook } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { TopBar } from "./components/layout/TopBar.jsx";
import { CoursesPage } from "./pages/CoursesPage.jsx";
import { LessonsPage } from "./pages/LessonsPage.jsx";
import { JobsPage } from "./pages/JobsPage.jsx";
import { ExportPage } from "./pages/ExportPage.jsx";
import { MonitorPage } from "./pages/MonitorPage.jsx";
import { UtilityPage } from "./pages/UtilityPage.jsx";

const pages = {
  monitor: { title: "API Monitor", icon: Activity, component: MonitorPage },
  courses: { title: "Courses", icon: BookOpen, component: CoursesPage },
  lessons: { title: "Lessons", icon: ListVideo, component: LessonsPage },
  jobs: { title: "Jobs", icon: Briefcase, component: JobsPage },
  export: { title: "Export", icon: Download, component: ExportPage },
  "api-keys": { title: "API Keys", icon: KeyRound, component: UtilityPage },
  webhooks: { title: "Webhooks", icon: Webhook, component: UtilityPage },
  logs: { title: "Logs", icon: FileClock, component: UtilityPage },
  docs: { title: "API Documentation", icon: Code2, component: UtilityPage },
  settings: { title: "Settings", icon: Settings, component: UtilityPage },
  support: { title: "Support", icon: LifeBuoy, component: UtilityPage }
};

export default function App() {
  const [activePage, setActivePage] = useState("monitor");
  const Page = pages[activePage].component;

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-panel">
        <TopBar title={pages[activePage].title} onNavigate={setActivePage} />
        <Page pageId={activePage} onNavigate={setActivePage} />
      </main>
    </div>
  );
}
