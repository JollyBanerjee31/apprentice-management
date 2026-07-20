import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LeaveBalanceWidgetProps {
  used: number;
  total: number;
  lopDays: number;
  stipend?: number;
}

export function LeaveBalanceWidget({ used, total, lopDays, stipend }: LeaveBalanceWidgetProps) {
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--text-3)]">
        Leave Balance
      </p>
      <p className="mt-2 font-mono text-[48px] font-bold leading-none tracking-[-1px] text-[var(--orange)]">
        {remaining}
      </p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[var(--orange-lt)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--text-2)]">
        {used} of {total} days used
      </p>

      {lopDays > 0 && (
        <p className="mt-3 rounded-md bg-[var(--orange-lt)] px-3 py-2 text-xs text-[var(--orange-dk)]">
          {lopDays} extra leave day{lopDays === 1 ? "" : "s"} taken as LOP
          {stipend !== undefined ? " — affects this month's stipend." : "."}
        </p>
      )}

      <div className="my-4 h-px bg-[var(--border)]" />

      <Link href="/apprentice/apply">
        <Button className="w-full bg-[var(--orange)] text-white hover:bg-[var(--orange-dk)]">
          Apply for Leave
        </Button>
      </Link>
    </div>
  );
}
