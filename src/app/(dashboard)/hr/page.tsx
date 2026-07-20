import { auth } from "@/auth";
import { LeaveRequestsPanel } from "@/components/shared/leave-requests-panel";
import {
  LopDonutWidget,
  type LopDonutItem,
} from "@/components/shared/lop-donut-widget";
import { MonthSelect } from "@/components/shared/month-select";
import { StatCard } from "@/components/shared/stat-card";
import {
  getAllExtraLeaveRequests,
  getAllLeaveRequests,
  getAllUsers,
  getPayrollForMonth,
  overlapsMonth,
} from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarOff,
  ChevronRight,
  FileSpreadsheet,
  UserCog,
} from "lucide-react";
import Link from "next/link";

export default async function HrDashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await auth();
  const name = session!.user.name ?? "";
  const firstName = name.split(" ")[0] ?? name;

  const now = new Date();
  const month = Number(searchParams.month) || now.getMonth() + 1;
  const year = Number(searchParams.year) || now.getFullYear();

  const [users, leaveRequests, extraLeaveRequests, payroll] = await Promise.all(
    [
      getAllUsers(),
      getAllLeaveRequests(),
      getAllExtraLeaveRequests(),
      getPayrollForMonth(month, year),
    ],
  );

  const managerNames = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const apprentices = users.filter((u) => u.role === "apprentice");
  const activeApprenticeCount = apprentices.filter((u) => u.active !== false).length;
  const archivedApprenticeCount = apprentices.length - activeApprenticeCount;
  const pendingCount = leaveRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const lopPendingThisMonth = extraLeaveRequests.filter(
    (r) =>
      r.status === "pending" &&
      overlapsMonth(r.startDate, r.endDate, month, year),
  ).length;
  const totalPayroll = payroll.reduce((sum, p) => sum + p.finalPayment, 0);

  const hour = now.getHours();
  const timeGreeting =
    hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const requestsThisMonth = leaveRequests
    .filter((r) => overlapsMonth(r.startDate, r.endDate, month, year))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const lopApprovedThisMonth = extraLeaveRequests.filter(
    (r) =>
      r.status === "approved" &&
      overlapsMonth(r.startDate, r.endDate, month, year),
  );
  const lopPendingRequestsThisMonth = extraLeaveRequests.filter(
    (r) =>
      r.status === "pending" &&
      overlapsMonth(r.startDate, r.endDate, month, year),
  );
  const approvedDays = lopApprovedThisMonth.reduce(
    (sum, r) => sum + (r.lopDays ?? r.noOfDays),
    0,
  );
  const pendingDays = lopPendingRequestsThisMonth.reduce(
    (sum, r) => sum + (r.lopDays ?? r.noOfDays),
    0,
  );
  const lopItems: LopDonutItem[] = [
    ...lopApprovedThisMonth.map((r) => ({
      id: r.id,
      name: r.apprenticeName,
      days: r.lopDays ?? r.noOfDays,
      amount: r.deduction,
      status: "approved" as const,
    })),
    ...lopPendingRequestsThisMonth.map((r) => ({
      id: r.id,
      name: r.apprenticeName,
      days: r.lopDays ?? r.noOfDays,
      status: "pending" as const,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[var(--text-1)]">
          Good {timeGreeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-2)]">
          {dateLabel} · Organisation overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Apprentices"
          value={activeApprenticeCount}
          variant="blue"
          sub={archivedApprenticeCount > 0 ? `${archivedApprenticeCount} archived` : "Active apprentices"}
        />
        <StatCard
          label="Pending Requests"
          value={pendingCount}
          variant="orange"
          sub="Awaiting approval"
        />
        <StatCard
          label="LOP This Month"
          value={lopPendingThisMonth}
          variant="red"
          sub="Total LOP days"
        />
        <StatCard
          label="Total Payroll"
          value={formatCurrency(totalPayroll)}
          variant="green"
          sub="This month"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1fr]">
        <LeaveRequestsPanel
          title="All Leave Requests"
          requests={requestsThisMonth}
          managerNames={managerNames}
          monthSelect={<MonthSelect month={month} year={year} />}
          viewAllHref="/hr/leave-requests"
        />

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--text-1)]">
              Quick Actions
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`/api/hr/payroll/export?month=${month}&year=${year}`}
                className="flex items-center justify-between rounded-[10px] bg-[var(--orange-lt)] px-4 py-3.5 text-sm font-medium text-[var(--orange)] transition-opacity hover:opacity-90"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Payroll Excel
                </span>
                <ChevronRight className="h-4 w-4" />
              </a>
              <Link
                href="/hr/apprentices?add=1"
                className="flex items-center justify-between rounded-[10px] bg-[var(--navy)] px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <span className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Manage Apprentices
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/hr/holidays"
                className="flex items-center justify-between rounded-[10px] border border-[var(--border)] px-4 py-3.5 text-sm font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--surface)]"
              >
                <span className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 text-[var(--text-2)]" />
                  Update Holidays
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
              </Link>
            </div>
          </div>

          <LopDonutWidget
            title={`LOP Summary — ${now.toLocaleDateString("en-US", { month: "long" })} ${year}`}
            viewReportHref="/hr/lop"
            approvedDays={approvedDays}
            pendingDays={pendingDays}
            items={lopItems}
          />
        </div>
      </div>
    </div>
  );
}
