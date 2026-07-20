"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalCard } from "@/components/shared/approval-card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PersonCell } from "@/components/shared/person-cell";
import { formatDate, initials } from "@/lib/utils";
import type { LeaveRequest } from "@/types/index";

function historyColumns(decidedLabel: string): DataTableColumn<LeaveRequest>[] {
  return [
    {
      key: "name",
      label: "Name",
      render: (r) => <PersonCell name={r.apprenticeName} role="Apprentice" />,
    },
    { key: "type", accessor: "leaveType", label: "Type" },
    { key: "date", label: "Date", render: (r) => formatDate(r.startDate) },
    { key: "days", accessor: "noOfDays", label: "Days" },
    {
      key: "decidedOn",
      label: decidedLabel,
      render: (r) => (r.decidedAt ? formatDate(r.decidedAt) : "—"),
    },
  ];
}

export default function ManagerApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/manager/requests");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const rejected = useMemo(() => requests.filter((r) => r.status === "rejected"), [requests]);

  async function decide(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/manager/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveRequestId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      toast.success(action === "approve" ? "Leave request approved" : "Leave request rejected");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approvals" subtitle="Review leave requests from your apprentices" />

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
                No pending approvals
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((r) => (
                  <ApprovalCard
                    key={r.id}
                    request={{
                      id: r.id,
                      name: r.apprenticeName,
                      initials: initials(r.apprenticeName),
                      leaveType: r.leaveType,
                      dateRange: formatDate(r.startDate),
                      days: r.noOfDays,
                      requestId: r.requestId,
                    }}
                    onApprove={(id) => decide(id, "approve")}
                    onReject={(id) => decide(id, "reject")}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <DataTable
              columns={historyColumns("Approved On")}
              data={approved}
              rowKey={(r) => r.id}
              emptyMessage="No approved requests yet"
            />
          </TabsContent>

          <TabsContent value="rejected">
            <DataTable
              columns={historyColumns("Rejected On")}
              data={rejected}
              rowKey={(r) => r.id}
              emptyMessage="No rejected requests yet"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
