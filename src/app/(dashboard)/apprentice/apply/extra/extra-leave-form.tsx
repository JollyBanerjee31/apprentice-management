"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface ExtraLeaveFormProps {
  perDay: number;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function ExtraLeaveForm({ perDay }: ExtraLeaveFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const noOfDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
  }, [startDate, endDate]);

  const estimatedDeduction = Math.round(perDay * noOfDays);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (noOfDays <= 0) {
      setFormError("End date must be on or after the start date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leave/submit-extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Extra leave request submitted");
      router.push("/apprentice/history");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
    >
      <div className="rounded-md border border-[var(--orange)]/30 bg-[var(--orange-lt)] px-4 py-3 text-sm text-[var(--orange-dk)]">
        This leave will be Loss of Pay. Your stipend will be deducted at{" "}
        <span className="font-mono font-semibold">{formatCurrency(perDay)}</span>/day.
      </div>

      {formError && (
        <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger-lt)] px-4 py-3 text-sm text-[var(--danger)]">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            min={TODAY}
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            min={startDate || TODAY}
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason*</Label>
        <Textarea id="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="noOfDays">No. of Days</Label>
        <Input id="noOfDays" value={noOfDays} readOnly disabled className="bg-background" />
      </div>

      {noOfDays > 0 && (
        <p className="text-sm text-muted-foreground">
          Estimated deduction:{" "}
          <span className="font-mono font-semibold text-[var(--danger)]">
            {formatCurrency(estimatedDeduction)}
          </span>{" "}
          ({noOfDays} × {formatCurrency(perDay)}/day)
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="orange" disabled={submitting || noOfDays <= 0}>
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
