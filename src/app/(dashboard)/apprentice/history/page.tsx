import { auth } from "@/auth";
import { getLeaveRequestsByApprentice } from "@/lib/firestore";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { YearSelect } from "@/components/shared/year-select";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest } from "@/types/index";

export default async function LeaveHistoryPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  const year = Number(searchParams.year) || new Date().getFullYear();

  const allRequests = await getLeaveRequestsByApprentice(session!.user.id);
  const requests = allRequests
    .filter((r) => r.startDate.startsWith(String(year)))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "requestId", accessor: "requestId", label: "Request ID", mono: true },
    { key: "type", accessor: "leaveType", label: "Type" },
    {
      key: "startDate",
      label: "Start Date",
      render: (r) => formatDate(r.startDate),
    },
    { key: "endDate", label: "End Date", render: (r) => formatDate(r.endDate) },
    { key: "days", accessor: "noOfDays", label: "Days" },
    { key: "manager", accessor: "managerEmail", label: "Manager" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "decidedOn",
      label: "Decided On",
      render: (r) => (r.decidedAt ? formatDate(r.decidedAt) : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leave History" action={<YearSelect year={year} />} />
      <DataTable
        columns={columns}
        data={requests}
        rowKey={(r) => r.id}
        emptyState={{
          title: "No leave requests yet",
          description: "Your leave requests will appear here once you apply",
          icon: "calendar",
          action: { label: "Apply for Leave", href: "/apprentice/apply" },
        }}
      />
    </div>
  );
}
