export function StatusBadge({ status = "planned" }) {
  return <span className={`statusBadge ${status.replace(/\s+/g, "-")}`}>{status}</span>;
}

