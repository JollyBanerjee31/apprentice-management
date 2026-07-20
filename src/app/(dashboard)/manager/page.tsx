import { CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { getAllUsers, getLeaveRequestsByManager } from "@/lib/firestore";
import { StatCard } from "@/components/shared/stat-card";
import { PendingApprovalsList } from "./pending-approvals-list";

export default async function ManagerDashboard() {
  const session = await auth();
  const managerId = session!.user.id;
  const name = session!.user.name ?? "";
  const firstName = name.split(" ")[0] ?? name;

  const [requests, users] = await Promise.all([
    getLeaveRequestsByManager(managerId),
    getAllUsers(),
  ]);

  const myApprentices = users.filter(
    (u) => u.role === "apprentice" && u.managerId === managerId && u.active !== false,
  );
  const pending = requests.filter((r) => r.status === "pending");
  const currentYear = String(new Date().getFullYear());
  const approvedThisYear = requests.filter(
    (r) => r.status === "approved" && r.startDate.startsWith(currentYear),
  );
  const rejectedThisYear = requests.filter(
    (r) => r.status === "rejected" && r.startDate.startsWith(currentYear),
  );

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[var(--text-1)]">
          Good {timeGreeting}, {firstName} 👋
        </h1>
        <p
          className={`mt-1 text-[13px] ${pending.length > 0 ? "font-medium text-[var(--orange)]" : "text-[var(--text-2)]"}`}
        >
          You have {pending.length} pending approval{pending.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={pending.length} variant="orange" />
        <StatCard label="Approved (this year)" value={approvedThisYear.length} variant="green" />
        <StatCard
          label="Rejected (this year)"
          value={rejectedThisYear.length}
          variant="red"
          icon={XCircle}
        />
        <StatCard label="My Team" value={myApprentices.length} variant="blue" />
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-lt)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-1)]">All caught up!</h3>
          <p className="text-sm text-[var(--text-2)]">
            No pending approvals. Your team is up to date.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--orange)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--orange)]" />
            </span>
            <h3 className="text-base font-semibold text-[var(--text-1)]">Needs your attention</h3>
          </div>
          <PendingApprovalsList requests={pending} />
        </div>
      )}
    </div>
  );
}
