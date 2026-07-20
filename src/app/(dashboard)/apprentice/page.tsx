import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { auth } from "@/auth";
import {
  getLeaveRequestsByApprentice,
  getTotalLOPForMonth,
  getTotalUsedLeave,
  getUserById,
} from "@/lib/firestore";
import { getCachedHolidays } from "@/lib/cached-firestore";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { LeaveBalanceWidget } from "@/components/shared/leave-balance-widget";
import { Button } from "@/components/ui/button";
import { MONTH_NAMES, formatDate } from "@/lib/utils";
import type { LeaveRequest } from "@/types/index";

export default async function ApprenticeDashboard() {
  const session = await auth();
  const userId = session!.user.id;
  const name = session!.user.name ?? "";
  const firstName = name.split(" ")[0] ?? name;

  const now = new Date();
  const [user, requests, holidays] = await Promise.all([
    getUserById(userId),
    getLeaveRequestsByApprentice(userId),
    getCachedHolidays(),
  ]);
  const usedLeave = await getTotalUsedLeave(userId);
  const lopDays = await getTotalLOPForMonth(userId, now.getMonth() + 1, now.getFullYear());

  const totalLeave = user?.totalLeave ?? 0;
  const balance = totalLeave - usedLeave;

  const recentRequests = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const today = now.toISOString().slice(0, 10);
  const upcomingHolidays = holidays.filter((h) => h.date >= today).slice(0, 2);

  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "requestId", accessor: "requestId", label: "Request ID", mono: true },
    { key: "date", label: "Date", render: (r) => formatDate(r.startDate) },
    { key: "type", accessor: "leaveType", label: "Type" },
    { key: "days", accessor: "noOfDays", label: "Days" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[var(--text-1)]">
          Good {timeGreeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-2)]">
          {dateLabel} · Here&apos;s your leave summary
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Leave" value={totalLeave} variant="orange" />
        <StatCard label="Used" value={usedLeave} variant="green" />
        <StatCard label="Remaining" value={balance} variant="blue" icon={CalendarClock} />
        <StatCard label="LOP Days" value={lopDays} variant="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--text-1)]">Recent Requests</h3>
            <Link href="/apprentice/history">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <DataTable
            columns={columns}
            data={recentRequests}
            rowKey={(r) => r.id}
            emptyMessage="No leave requests yet"
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <LeaveBalanceWidget
            used={usedLeave}
            total={totalLeave}
            lopDays={lopDays}
            stipend={user?.stipend}
          />

          <div className="rounded-xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Upcoming Holidays</h3>
            {upcomingHolidays.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-2)]">No upcoming holidays</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {upcomingHolidays.map((h, i) => {
                  const [, hm, hd] = h.date.split("-").map(Number);
                  const monthAbbr = MONTH_NAMES[hm! - 1]!.slice(0, 3).toUpperCase();
                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg ${
                          i === 0
                            ? "bg-[var(--orange)] text-white"
                            : "bg-[var(--surface)] text-[var(--text-2)]"
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {monthAbbr}
                        </span>
                        <span className="mt-0.5 text-sm font-bold leading-none">{hd}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-1)]">
                          {h.name}
                        </p>
                        <p className="text-xs text-[var(--text-2)]">{h.day}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
