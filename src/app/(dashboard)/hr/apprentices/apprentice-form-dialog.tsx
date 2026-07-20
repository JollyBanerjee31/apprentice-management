"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppUser } from "@/types/index";

interface ApprenticeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apprentice: AppUser | null;
  onSaved: () => void;
}

const EMPTY_FORM = {
  name: "",
  apprenticeId: "",
  email: "",
  hireDate: "",
  stipend: "",
  totalLeave: "12",
  managerName: "",
  managerEmail: "",
};

export function ApprenticeFormDialog({
  open,
  onOpenChange,
  apprentice,
  onSaved,
}: ApprenticeFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = apprentice !== null;

  useEffect(() => {
    if (apprentice) {
      setForm({
        name: apprentice.name,
        apprenticeId: apprentice.apprenticeId ?? "",
        email: apprentice.email,
        hireDate: apprentice.hireDate,
        stipend: String(apprentice.stipend),
        totalLeave: String(apprentice.totalLeave),
        managerName: apprentice.managerName ?? "",
        managerEmail: apprentice.managerEmail ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [apprentice, open]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      apprenticeId: form.apprenticeId,
      email: form.email,
      hireDate: form.hireDate,
      stipend: Number(form.stipend),
      totalLeave: Number(form.totalLeave),
      managerName: form.managerName,
      managerEmail: form.managerEmail,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/hr/apprentices/${apprentice!.id}` : "/api/hr/apprentices",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }

      toast.success(isEdit ? "Apprentice updated" : "Apprentice added successfully");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Apprentice" : "Add Apprentice"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Personal Information
            </h3>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full Name*</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="apprenticeId">Apprentice ID*</Label>
              <Input
                id="apprenticeId"
                required
                placeholder="e.g. APP-1042"
                value={form.apprenticeId}
                onChange={(e) => set("apprenticeId", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Work Email*</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </section>

          <hr className="border-border" />

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employment Details
            </h3>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hireDate">Hire Date*</Label>
              <Input
                id="hireDate"
                type="date"
                required
                value={form.hireDate}
                onChange={(e) => set("hireDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stipend">Monthly Stipend* (₹)</Label>
                <Input
                  id="stipend"
                  type="number"
                  min={0}
                  required
                  value={form.stipend}
                  onChange={(e) => set("stipend", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totalLeave">Total Leave Days*</Label>
                <Input
                  id="totalLeave"
                  type="number"
                  min={0}
                  required
                  value={form.totalLeave}
                  onChange={(e) => set("totalLeave", e.target.value)}
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reporting Manager
            </h3>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="managerName">Manager Name*</Label>
              <Input
                id="managerName"
                required
                value={form.managerName}
                onChange={(e) => set("managerName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="managerEmail">Manager Email*</Label>
              <Input
                id="managerEmail"
                type="email"
                required
                value={form.managerEmail}
                onChange={(e) => set("managerEmail", e.target.value)}
              />
            </div>
          </section>

          {!isEdit && (
            <p className="rounded-md bg-[var(--orange-lt)] px-3 py-2 text-xs text-[var(--orange-dk)]">
              An onboarding email will be sent to the apprentice&apos;s work email once the record
              is created.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={isEdit ? "navy" : "orange"} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Apprentice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
