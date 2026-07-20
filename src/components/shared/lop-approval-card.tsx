"use client";

import { memo, useState } from "react";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

export interface LopApprovalCardRequest {
  id: string;
  apprenticeName: string;
  apprenticeCode?: string;
  startDate: string;
  endDate: string;
  noOfDays: number;
  reason: string;
  estimatedDeduction: number;
  perDay: number;
}

interface LopApprovalCardProps {
  request: LopApprovalCardRequest;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string) => Promise<void> | void;
}

function LopApprovalCardInner({ request, onApprove, onReject }: LopApprovalCardProps) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function handle(action: "approve" | "reject") {
    setPending(action);
    try {
      await (action === "approve" ? onApprove(request.id) : onReject(request.id));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-2)]" />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold text-white">
            {initials(request.apprenticeName)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {request.apprenticeName}
              {request.apprenticeCode && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {request.apprenticeCode}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Extra Leave (LOP) · {formatDate(request.startDate)} to {formatDate(request.endDate)}{" "}
              · {request.noOfDays}d
            </p>
          </div>
        </div>
        <StatusBadge status="pending" label="Pending HR Approval" />
      </div>

      <p className="text-sm text-foreground">Reason: {request.reason}</p>

      <p className="text-sm text-muted-foreground">
        Estimated deduction:{" "}
        <span className="font-mono font-semibold text-[var(--danger)]">
          {formatCurrency(request.estimatedDeduction)}
        </span>{" "}
        ({request.noOfDays} × {formatCurrency(request.perDay)}/day)
      </p>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="success"
          disabled={pending !== null}
          onClick={() => handle("approve")}
        >
          {pending === "approve" ? "Approving…" : "Approve"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="reject"
          disabled={pending !== null}
          onClick={() => handle("reject")}
        >
          {pending === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}

export const LopApprovalCard = memo(LopApprovalCardInner);
