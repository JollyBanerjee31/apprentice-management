"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PayslipMonth } from "./payslips-grid";

interface SignSlipDialogProps {
  month: PayslipMonth | null;
  onOpenChange: (open: boolean) => void;
  onSigned: () => void;
}

export function SignSlipDialog({ month, onOpenChange, onSigned }: SignSlipDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    if (!f) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!month || !preview) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/apprentice/sign-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: month.month, year: month.year, signatureDataUrl: preview }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      toast.success("Stipend slip signed and submitted to HR");
      setFile(null);
      setPreview(null);
      onSigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={month !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Stipend Slip — {month?.label}</DialogTitle>
        </DialogHeader>

        {month && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Final amount:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(month.finalPayment ?? 0)}
              </span>
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground hover:bg-muted">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Signature preview" className="h-20 object-contain" />
              ) : (
                <span>Click to upload your signature image</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <p className="text-xs text-muted-foreground">
              By signing, I confirm receipt of my stipend for {month.label}.
            </p>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="orange"
                disabled={!file || submitting}
                onClick={handleSubmit}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Submitting…" : "Sign & Submit"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
