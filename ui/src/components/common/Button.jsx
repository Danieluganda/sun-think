export function Button({ children, icon: Icon, variant = "primary", ...props }) {
  return (
    <button className={`btn ${variant}`} type="button" {...props}>
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}
