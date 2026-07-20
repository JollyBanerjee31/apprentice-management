"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HolidayFormDialog } from "./holiday-form-dialog";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatDate } from "@/lib/utils";
import type { Holiday } from "@/types/index";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hr/holidays");
    const data = await res.json();
    setHolidays(data.holidays ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(holiday: Holiday) {
    setEditing(holiday);
    setDialogOpen(true);
  }

  const { execute: confirmDelete, loading: deleting } = useAsyncAction(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/hr/holidays/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete holiday");
      toast.success("Holiday deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  });

  const columns: DataTableColumn<Holiday>[] = [
    { key: "date", accessor: "date", label: "Date", render: (h) => formatDate(h.date) },
    { key: "day", accessor: "day", label: "Day" },
    { key: "name", accessor: "name", label: "Holiday Name" },
    {
      key: "comments",
      label: "Comments",
      className: "text-muted-foreground",
      render: (h) => h.comments || "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (h) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(h)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(h)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Holiday List"
        subtitle={`Manage public holidays for ${new Date().getFullYear()}`}
        action={
          <Button onClick={openAdd} variant="orange">
            + Add Holiday
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={holidays}
          rowKey={(h) => h.id}
          emptyMessage="No holidays added yet"
        />
      )}

      <HolidayFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holiday={editing}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
