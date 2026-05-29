import { Badge } from "../common/Badge.jsx";

const tones = {
  done: "success",
  completed: "success",
  running: "info",
  translating: "info",
  downloading: "info",
  fetching: "info",
  pending: "warning",
  queued: "warning",
  failed: "danger"
};

export function StatusBadge({ status }) {
  return <Badge tone={tones[status] || "neutral"}>{status}</Badge>;
}
