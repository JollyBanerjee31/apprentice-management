"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PersonCell } from "@/components/shared/person-cell";
import { LopApprovalCard } from "@/components/shared/lop-approval-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExtraLeaveRequest } from "@/types/index";

interface PendingLopRequest extends ExtraLeaveRequest {
  apprenticeCode?: string;
  perDay: number;
  estimatedDeduction: number;
}

export default function LopApprovalsPage() {
  const [pending, setPending] = useState<PendingLopRequest[]>([]);
  const [history, setHistory] = useState<ExtraLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hr/lop");
    const data = await res.json();
    setPending(data.pending ?? []);
    setHistory(data.history ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/hr/lop/${id}/${action}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      toast.success(action === "approve" ? "Extra leave approved" : "Leave request rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const historyColumns: DataTableColumn<ExtraLeaveRequest>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => <PersonCell name={r.apprenticeName} role="Apprentice" />,
    },
    {
      key: "dates",
      label: "Dates",
      render: (r) => `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
    },
    { key: "days", accessor: "noOfDays", label: "Days" },
    {
      key: "deduction",
      label: "Deduction",
      mono: true,
      render: (r) => formatCurrency(r.deduction ?? 0),
    },
    {
      key: "finalPay",
      label: "Final Pay",
      mono: true,
      render: (r) => formatCurrency(r.finalPayment ?? 0),
    },
    {
      key: "decision",
      label: "Decision",
      render: (r) => <StatusBadge status={r.status === "approved" ? "approved" : "rejected"} />,
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (r.decidedAt ? formatDate(r.decidedAt) : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Extra Leave (LOP) Approvals"
        subtitle={`${pending.length} request${pending.length === 1 ? "" : "s"} pending HR review`}
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          No LOP requests pending review
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((r) => (
            <LopApprovalCard
              key={r.id}
              request={{
                id: r.id,
                apprenticeName: r.apprenticeName,
                apprenticeCode: r.apprenticeCode,
                startDate: r.startDate,
                endDate: r.endDate,
                noOfDays: r.noOfDays,
                reason: r.reason,
                estimatedDeduction: r.estimatedDeduction,
                perDay: r.perDay,
              }}
              onApprove={(id) => decide(id, "approve")}
              onReject={(id) => decide(id, "reject")}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Decision History</h2>
        <DataTable
          columns={historyColumns}
          data={history}
          rowKey={(r) => r.id}
          emptyMessage="No LOP decisions yet"
        />
      </div>
    </div>
  );
}
