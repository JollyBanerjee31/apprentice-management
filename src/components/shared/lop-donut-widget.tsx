"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { NoRecords } from "@/components/shared/no-records";
import { formatCurrency, initials } from "@/lib/utils";

export interface LopDonutItem {
  id: string;
  name: string;
  days: number;
  amount?: number;
  status: "approved" | "pending";
}

interface LopDonutWidgetProps {
  title: string;
  viewReportHref?: string;
  approvedDays: number;
  pendingDays: number;
  items: LopDonutItem[];
}

const STATUS_TAG: Record<LopDonutItem["status"], { bg: string; text: string; label: string }> = {
  approved: { bg: "#f0fdf4", text: "#16a34a", label: "Approved" },
  pending: { bg: "#fff4e0", text: "#ff8b00", label: "Pending" },
};

const MAX_VISIBLE_ITEMS = 3;

export function LopDonutWidget({
  title,
  viewReportHref,
  approvedDays,
  pendingDays,
  items,
}: LopDonutWidgetProps) {
  const total = approvedDays + pendingDays;
  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-1)]">{title}</h3>
        {viewReportHref && (
          <Link
            href={viewReportHref}
            className="text-xs font-semibold text-[var(--orange)] hover:underline"
          >
            View report
          </Link>
        )}
      </div>

      {total === 0 ? (
        <NoRecords
          title="No LOP this month"
          description="Approved and pending extra-leave deductions will show up here."
          icon="inbox"
        />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-[120px] w-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: approvedDays },
                      { name: "Pending", value: pendingDays },
                    ]}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={56}
                    paddingAngle={approvedDays && pendingDays ? 3 : 0}
                    stroke="none"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ff8b00" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-[var(--text-1)]">{total}</span>
                <span className="text-[10px] font-semibold text-[var(--text-3)]">Total LOP days</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-[var(--text-2)]">Approved</span>
                <span className="font-semibold text-[var(--text-1)]">{approvedDays}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--orange)]" />
                <span className="text-[var(--text-2)]">Pending</span>
                <span className="font-semibold text-[var(--text-1)]">{pendingDays}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col divide-y divide-[var(--border)]">
            {visibleItems.map((item) => {
              const tag = STATUS_TAG[item.status];
              return (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--orange)] text-xs font-semibold text-white">
                    {initials(item.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-1)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-3)]">{item.days} LOP days</p>
                  </div>
                  {item.amount !== undefined && (
                    <p className="font-mono text-sm font-semibold text-[var(--text-1)]">
                      {formatCurrency(item.amount)}
                    </p>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: tag.bg, color: tag.text }}
                  >
                    {tag.label}
                  </span>
                </div>
              );
            })}
          </div>

          {hiddenCount > 0 && viewReportHref && (
            <Link
              href={viewReportHref}
              className="mt-3 block text-center text-xs font-semibold text-[var(--orange)] hover:underline"
            >
              View all ({items.length})
            </Link>
          )}
        </>
      )}
    </div>
  );
}
