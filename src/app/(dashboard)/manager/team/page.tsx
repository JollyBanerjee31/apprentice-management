import { auth } from "@/auth";
import { getAllUsers, getTotalLOPForMonth, getTotalUsedLeave } from "@/lib/firestore";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PersonCell } from "@/components/shared/person-cell";
import { formatDate } from "@/lib/utils";
import type { AppUser } from "@/types/index";

interface TeamRow extends AppUser {
  used: number;
  balance: number;
  lopDays: number;
}

export default async function ManagerTeamPage() {
  const session = await auth();
  const managerId = session!.user.id;

  const users = await getAllUsers();
  const apprentices = users.filter(
    (u) => u.role === "apprentice" && u.managerId === managerId && u.active !== false,
  );

  const now = new Date();
  const rows: TeamRow[] = await Promise.all(
    apprentices.map(async (a) => {
      const used = await getTotalUsedLeave(a.id);
      const lopDays = await getTotalLOPForMonth(a.id, now.getMonth() + 1, now.getFullYear());
      return { ...a, used, balance: a.totalLeave - used, lopDays };
    }),
  );

  const columns: DataTableColumn<TeamRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => <PersonCell name={r.name} role="Apprentice" />,
    },
    { key: "id", label: "ID", mono: true, render: (r) => r.apprenticeId ?? "—" },
    { key: "hireDate", label: "Hire Date", render: (r) => formatDate(r.hireDate) },
    { key: "used", accessor: "used", label: "Used Leave" },
    {
      key: "balance",
      label: "Balance",
      render: (r) => (
        <span
          className={
            r.balance > 3
              ? "font-semibold text-[var(--orange)]"
              : r.balance <= 2
                ? "font-semibold text-[var(--danger)]"
                : "text-foreground"
          }
        >
          {r.balance}
        </span>
      ),
    },
    { key: "lopDays", accessor: "lopDays", label: "LOP Days" },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        if (r.balance <= 0) return <StatusBadge status="rejected" label="Exhausted" />;
        if (r.balance <= 3) return <StatusBadge status="pending" label="Low Balance" />;
        return <StatusBadge status="approved" label="Active" />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Apprentices"
        subtitle={`${apprentices.length} apprentice${apprentices.length === 1 ? "" : "s"} reporting to you`}
      />
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        emptyMessage="No apprentices assigned to you yet"
      />
    </div>
  );
}
