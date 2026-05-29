export function ProgressRing({ value }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <span className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` }}>
      {progress}
    </span>
  );
}
