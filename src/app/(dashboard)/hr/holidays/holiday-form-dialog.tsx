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
import { Textarea } from "@/components/ui/textarea";
import { dayOfWeek } from "@/lib/utils";
import type { Holiday } from "@/types/index";

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: Holiday | null;
  onSaved: () => void;
}

const EMPTY_FORM = { date: "", name: "", comments: "" };

export function HolidayFormDialog({
  open,
  onOpenChange,
  holiday,
  onSaved,
}: HolidayFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = holiday !== null;

  useEffect(() => {
    if (holiday) {
      setForm({ date: holiday.date, name: holiday.name, comments: holiday.comments ?? "" });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [holiday, open]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = { date: form.date, name: form.name, comments: form.comments };

    try {
      const res = await fetch(isEdit ? `/api/hr/holidays/${holiday!.id}` : "/api/hr/holidays", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }

      toast.success(isEdit ? "Holiday updated" : "Holiday added");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const day = form.date ? dayOfWeek(form.date) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date*</Label>
            <Input
              id="date"
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Holiday Name*</Label>
            <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day">Day</Label>
            <Input id="day" value={day} readOnly disabled className="bg-background" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(e) => set("comments", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={isEdit ? "navy" : "orange"} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
