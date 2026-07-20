"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeaveType } from "@/types/index";

interface ApplyLeaveFormProps {
  balance: number;
}

interface SubmitError {
  code?: string;
  message: string;
  holidayName?: string;
  extraLeaveUrl?: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

function errorStyle(code?: string) {
  if (code === "PENDING_EXISTS") return "border-[var(--navy)]/30 bg-[var(--navy-lt)] text-[var(--navy)]";
  if (code === "APPROVED_EXISTS")
    return "border-[var(--orange)]/30 bg-[var(--orange-lt)] text-[var(--orange-dk)]";
  return "border-[var(--danger)]/30 bg-[var(--danger-lt)] text-[var(--danger)]";
}

export function ApplyLeaveForm({ balance }: ApplyLeaveFormProps) {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>("Casual/Sick Leave");
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<SubmitError | null>(null);

  const noOfDays = startDate ? 1 : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/leave/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate: startDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data);
        return;
      }

      toast.success("Leave request submitted");
      router.push("/apprentice/history");
    } catch {
      setFormError({ message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
    >
      <div
        className={`rounded-md border px-4 py-3 text-sm ${
          balance === 0
            ? "border-[var(--danger)]/30 bg-[var(--danger-lt)] text-[var(--danger)]"
            : "border-[var(--orange)]/30 bg-[var(--orange-lt)] text-[var(--orange-dk)]"
        }`}
      >
        You have {balance} day{balance === 1 ? "" : "s"} remaining. Only 1 day of leave is allowed
        per calendar month.
      </div>

      {formError && (
        <div className={`flex flex-col gap-2 rounded-md border px-4 py-3 text-sm ${errorStyle(formError.code)}`}>
          <p>{formError.message}</p>
          {formError.extraLeaveUrl && (
            <Link href={formError.extraLeaveUrl}>
              <Button type="button" size="sm" variant="orange" className="w-fit">
                Apply for Extra Leave
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leaveType">Leave Type</Label>
        <select
          id="leaveType"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="Casual/Sick Leave">Casual/Sick Leave</option>
          <option value="Annual Leave">Annual Leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            min={TODAY}
            required
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFormError(null);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={startDate}
            readOnly
            disabled
            className="bg-background"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="noOfDays">No. of Days</Label>
        <Input id="noOfDays" value={noOfDays} readOnly disabled className="bg-background" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="orange" disabled={submitting || !startDate}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit Request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/apprentice")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
