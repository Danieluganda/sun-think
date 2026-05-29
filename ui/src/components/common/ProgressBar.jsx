import { formatPercent } from "../../utils/formatters.js";

export function ProgressBar({ value }) {
  const width = formatPercent(value);
  return (
    <div className="progress-bar" aria-label={`Progress ${width}`}>
      <span style={{ width }} />
    </div>
  );
}
