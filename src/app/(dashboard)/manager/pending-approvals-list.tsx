"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApprovalCard } from "@/components/shared/approval-card";
import { formatDate, initials } from "@/lib/utils";
import type { LeaveRequest } from "@/types/index";

export function PendingApprovalsList({ requests }: { requests: LeaveRequest[] }) {
  const router = useRouter();

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
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => (
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
  );
}
