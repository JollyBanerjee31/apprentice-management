import { auth } from "@/auth";
import {
  getApprovedLeaveForMonth,
  getPendingLeaveForMonth,
  getTotalUsedLeave,
  getUserById,
} from "@/lib/firestore";
import { ApplyLeaveForm } from "./apply-leave-form";
import { formatDate } from "@/lib/utils";

export default async function ApplyLeavePage() {
  const session = await auth();
  const userId = session!.user.id;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [user, usedLeave, approvedThisMonth, pendingThisMonth] = await Promise.all([
    getUserById(userId),
    getTotalUsedLeave(userId),
    getApprovedLeaveForMonth(userId, month, year),
    getPendingLeaveForMonth(userId, month, year),
  ]);

  const balance = (user?.totalLeave ?? 0) - usedLeave;
  const thisMonthRequest = approvedThisMonth[0] ?? pendingThisMonth[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Apply for Leave</h2>
        <ApplyLeaveForm balance={balance} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
          <ol className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                1
              </span>
              Your request is sent to your manager for approval.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                2
              </span>
              You&apos;ll get an email as soon as they decide.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                3
              </span>
              Approved leave updates your balance automatically.
            </li>
          </ol>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">This Month</h3>
          {thisMonthRequest ? (
            <div className="mt-3 text-sm">
              <p className="text-foreground">
                {thisMonthRequest.leaveType} on {formatDate(thisMonthRequest.startDate)}
              </p>
              <p className="mt-1 capitalize text-muted-foreground">{thisMonthRequest.status}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No leave taken yet</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Balance:{" "}
            <span className="font-mono font-semibold text-foreground">{balance}</span> day
            {balance === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}
