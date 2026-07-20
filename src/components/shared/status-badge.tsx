export type StatusBadgeStatus = "pending" | "approved" | "rejected" | "lop";

const STYLES: Record<StatusBadgeStatus, { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: "#fff4e0", text: "#b35c00", border: "#ffd080", label: "Pending" },
  approved: { bg: "#e8f8ee", text: "#1a6e3a", border: "#7ed9a0", label: "Approved" },
  rejected: { bg: "#fdecea", text: "#a01c1c", border: "#f4a0a0", label: "Rejected" },
  lop: { bg: "#fef3e2", text: "#8a4400", border: "#ffb84d", label: "LOP" },
};

export function StatusBadge({ status, label }: { status: StatusBadgeStatus; label?: string }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.text }} />
      {label ?? s.label}
    </span>
  );
}
