import { memo } from "react";
import { Clock, CreditCard, FileText, Users, type LucideIcon } from "lucide-react";

export type StatCardVariant = "blue" | "orange" | "red" | "green";

const VARIANT_STYLES: Record<
  StatCardVariant,
  { border: string; iconBg: string; iconColor: string; icon: LucideIcon }
> = {
  blue: { border: "#3b82f6", iconBg: "#eff6ff", iconColor: "#3b82f6", icon: Users },
  orange: { border: "#ff8b00", iconBg: "#fff4e0", iconColor: "#ff8b00", icon: Clock },
  red: { border: "#ef4444", iconBg: "#fef2f2", iconColor: "#ef4444", icon: FileText },
  green: { border: "#22c55e", iconBg: "#f0fdf4", iconColor: "#22c55e", icon: CreditCard },
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: StatCardVariant;
  /** Overrides the variant's default icon, for cards that need a specific one. */
  icon?: LucideIcon;
}

function StatCardInner({ label, value, sub, variant = "blue", icon }: StatCardProps) {
  const style = VARIANT_STYLES[variant];
  const Icon = icon ?? style.icon;

  return (
    <div
      className="rounded-xl border border-[var(--border)] border-l-[3px] bg-white p-5"
      style={{ borderLeftColor: style.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: style.iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: style.iconColor }} />
        </div>
        <p className="text-[13px] font-medium text-[var(--text-2)]">{label}</p>
      </div>
      <p className="mt-3 text-[32px] font-bold leading-none text-[var(--text-1)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--text-3)]">{sub}</p>}
    </div>
  );
}

export const StatCard = memo(StatCardInner);
