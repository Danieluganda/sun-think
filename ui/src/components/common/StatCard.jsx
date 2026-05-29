export function StatCard({ icon: Icon, label, value, hint, tone = "green" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{Icon ? <Icon size={18} /> : null}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}
