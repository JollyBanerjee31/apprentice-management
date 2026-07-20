"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactConfetti from "react-confetti";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PersonCell } from "@/components/shared/person-cell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ApprenticeFormDialog } from "./apprentice-form-dialog";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useWindowSize } from "@/hooks/use-window-size";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import type { AppUser } from "@/types/index";

const CONFETTI_COLORS = ["#ff8b00", "#00146c", "#ffffff", "#ffd080"];

export default function ApprenticesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const [apprentices, setApprentices] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hr/apprentices");
    const data = await res.json();
    setApprentices(data.apprentices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Lets the HR dashboard's "Add Apprentice" quick action (/hr/apprentices?add=1)
  // open the modal directly instead of just landing on the list.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/hr/apprentices");
    }
  }, [searchParams, router]);

  const activeApprentices = useMemo(
    () => apprentices.filter((u) => u.active !== false),
    [apprentices],
  );
  const archivedApprentices = useMemo(
    () => apprentices.filter((u) => u.active === false),
    [apprentices],
  );

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditing(user);
    setDialogOpen(true);
  }

  async function restoreApprentice(user: AppUser) {
    setRestoringId(user.id);
    try {
      const res = await fetch(`/api/hr/apprentices/${user.id}/restore`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to restore apprentice");
      }
      setApprentices((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: true, archivedAt: null } : u)),
      );
      toast.success(`${user.name} has been restored successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRestoringId(null);
    }
  }

  const { execute: confirmDelete, loading: deleting } = useAsyncAction(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      const res = await fetch(`/api/hr/apprentices/${target.id}/archive`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to remove apprentice");
      }
      setApprentices((prev) =>
        prev.map((u) =>
          u.id === target.id ? { ...u, active: false, archivedAt: new Date().toISOString() } : u,
        ),
      );
      setDeleteTarget(null);
      toast.success(`${target.name} has been removed. You can restore them from the Archived tab.`, {
        action: {
          label: "Undo",
          onClick: () => restoreApprentice(target),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  });

  function buildColumns(archived: boolean): DataTableColumn<AppUser>[] {
    return [
      {
        key: "name",
        label: "Name",
        render: (u) => <PersonCell name={u.name} role="Apprentice" />,
      },
      { key: "apprenticeId", label: "ID", mono: true, render: (u) => u.apprenticeId ?? "—" },
      { key: "email", accessor: "email", label: "Email", className: "text-muted-foreground" },
      { key: "manager", label: "Manager", render: (u) => u.managerName ?? "—" },
      { key: "hireDate", label: "Hire Date", render: (u) => formatDate(u.hireDate) },
      { key: "totalLeave", accessor: "totalLeave", label: "Leave Days" },
      {
        key: "stipend",
        label: "Stipend",
        mono: true,
        render: (u) => formatCurrency(u.stipend),
      },
      {
        key: "actions",
        label: "Actions",
        render: (u) =>
          archived ? (
            <Button
              variant="restore"
              size="sm"
              disabled={restoringId === u.id}
              onClick={() => restoreApprentice(u)}
            >
              {restoringId === u.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Restore
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                Edit
              </Button>
              <Button variant="reject" size="sm" onClick={() => setDeleteTarget(u)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          ),
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Apprentices"
        subtitle={`${activeApprentices.length} active · ${archivedApprentices.length} archived`}
        action={
          <Button onClick={openAdd} variant="orange">
            + Add Apprentice
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeApprentices.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedApprentices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <DataTable
              columns={buildColumns(false)}
              data={activeApprentices}
              rowKey={(u) => u.id}
              emptyState={{
                title: "No apprentices added yet",
                description: "Add your first apprentice to get started",
                icon: "users",
                action: { label: "Add Apprentice", onClick: openAdd },
              }}
            />
          </TabsContent>

          <TabsContent value="archived">
            <DataTable
              columns={buildColumns(true)}
              data={archivedApprentices}
              rowKey={(u) => u.id}
              rowClassName={() => "opacity-60"}
              emptyState={{
                title: "No archived apprentices",
                description: "Apprentices removed from the Active tab will show up here.",
                icon: "inbox",
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      <ApprenticeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        apprentice={editing}
        onSaved={() => {
          const wasAdd = editing === null;
          setDialogOpen(false);
          load();
          if (wasAdd) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }
        }}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Apprentice</AlertDialogTitle>
          </AlertDialogHeader>

          {deleteTarget && (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--orange)] text-lg font-semibold text-white">
                {initials(deleteTarget.name)}
              </div>
              <p className="text-sm font-semibold text-[var(--text-1)]">{deleteTarget.name}</p>
              {deleteTarget.apprenticeId && (
                <p className="font-mono text-xs text-[var(--text-3)]">
                  {deleteTarget.apprenticeId}
                </p>
              )}

              <AlertDialogDescription className="mt-2">
                Are you sure you want to remove {deleteTarget.name} from the system? They will
                immediately lose access to the Leave Management portal.
              </AlertDialogDescription>

              <p className="mt-2 rounded-md bg-[var(--orange-lt)] px-3 py-2 text-xs text-[var(--orange-dk)]">
                Their leave history and payroll records will be preserved. This action can be
                undone by restoring from the Archived tab.
              </p>
            </div>
          )}

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
              {deleting ? "Removing…" : "Remove Apprentice"}
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
