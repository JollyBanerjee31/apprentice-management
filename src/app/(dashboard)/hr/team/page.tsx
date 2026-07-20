"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactConfetti from "react-confetti";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PersonCell } from "@/components/shared/person-cell";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { HrFormDialog } from "./hr-form-dialog";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useWindowSize } from "@/hooks/use-window-size";
import { formatDate } from "@/lib/utils";
import type { AppUser } from "@/types/index";

const CONFETTI_COLORS = ["#ff8b00", "#00146c", "#ffffff", "#ffd080"];

export default function HrTeamPage() {
  const { width, height } = useWindowSize();
  const [hrUsers, setHrUsers] = useState<AppUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AppUser | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hr/team");
    const data = await res.json();
    setHrUsers(data.hrUsers ?? []);
    setCurrentUserId(data.currentUserId ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { execute: confirmRemove, loading: removing } = useAsyncAction(async () => {
    if (!removeTarget) return;
    try {
      const res = await fetch(`/api/hr/team/${removeTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to remove from HR team");
      }
      toast.success(`${removeTarget.name} removed from HR team`);
      setRemoveTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  });

  const columns: DataTableColumn<AppUser>[] = [
    {
      key: "name",
      label: "Name",
      render: (u) => <PersonCell name={u.name} role="HR Admin" tone="navy" />,
    },
    { key: "email", accessor: "email", label: "Email", className: "text-muted-foreground" },
    { key: "addedOn", label: "Added On", render: (u) => formatDate(u.createdAt) },
    { key: "status", label: "Status", render: () => <StatusBadge status="approved" label="Active" /> },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <Button
          variant="destructive"
          size="sm"
          disabled={u.id === currentUserId}
          onClick={() => setRemoveTarget(u)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="HR Team"
        subtitle="Manage HR administrators"
        action={
          <Button onClick={() => setDialogOpen(true)} variant="orange">
            + Add HR
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
          data={hrUsers}
          rowKey={(u) => u.id}
          emptyState={{
            title: "No HR admins yet",
            description: "Add your first HR administrator to get started",
            icon: "users",
            action: { label: "Add HR", onClick: () => setDialogOpen(true) },
          }}
        />
      )}

      <HrFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(name) => {
          setDialogOpen(false);
          load();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
          toast.success(`${name} added to HR team`);
        }}
      />

      <AlertDialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name} from HR team?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll immediately lose access to the HR dashboard. Their record is kept, not
              deleted, so this can be undone by adding them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              disabled={removing}
              className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin" />}
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          numberOfPieces={300}
          colors={CONFETTI_COLORS}
          recycle={false}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
    </div>
  );
}
