"use client";

import { memo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ApprovalCardRequest {
  id: string;
  name: string;
  initials: string;
  leaveType: string;
  dateRange: string;
  days: number;
  requestId: string;
  meta?: string;
}

interface ApprovalCardProps {
  request: ApprovalCardRequest;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string) => Promise<void> | void;
}

function ApprovalCardInner({ request, onApprove, onReject }: ApprovalCardProps) {
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
    <div className="relative flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-2)]" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold text-white">
          {request.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{request.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.leaveType} · {request.dateRange} · {request.days}d ·{" "}
            <span className="font-mono">{request.requestId}</span>
          </p>
          {request.meta && <p className="mt-0.5 text-xs text-muted-foreground">{request.meta}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
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

// Note: onApprove/onReject are usually inline arrows at the call site (a new
// reference every parent render), so this memo mainly helps once callers
// wrap those in useCallback — harmless no-op otherwise, not a regression.
export const ApprovalCard = memo(ApprovalCardInner);
