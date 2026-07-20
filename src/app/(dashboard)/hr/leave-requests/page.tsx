import { PageHeader } from "@/components/shared/page-header";
import { LeaveRequestsPanel } from "@/components/shared/leave-requests-panel";
import { getAllLeaveRequests, getAllUsers } from "@/lib/firestore";

export default async function HrLeaveRequestsPage() {
  const [requests, users] = await Promise.all([getAllLeaveRequests(), getAllUsers()]);
  const managerNames = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="All Leave Requests" subtitle="Every leave request across the organisation" />
      <LeaveRequestsPanel title="All Leave Requests" requests={sorted} managerNames={managerNames} />
    </div>
  );
}
