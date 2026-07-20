"use client";

import { NoRecords } from "@/components/shared/no-records";
import { PersonCell } from "@/components/shared/person-cell";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/index";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const TYPE_DOT_COLOR: Record<LeaveType, string> = {
  "Annual Leave": "#3b82f6",
  "Casual/Sick Leave": "#ff8b00",
  "Extra Leave (LOP)": "#ef4444",
};

const STATUS_PILL: Record<
  LeaveStatus,
  { bg: string; text: string; label: string }
> = {
  approved: { bg: "#dcfce7", text: "#16a34a", label: "Approved" },
  pending: { bg: "#fff4e0", text: "#ff8b00", label: "Pending" },
  rejected: { bg: "#fef2f2", text: "#dc2626", label: "Rejected" },
};

const TABS: { key: "all" | LeaveStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 6;

interface LeaveRequestsPanelProps {
  title: string;
  requests: LeaveRequest[];
  managerNames: Record<string, string>;
  monthSelect?: React.ReactNode;
  viewAllHref?: string;
}

export function LeaveRequestsPanel({
  title,
  requests,
  managerNames,
  monthSelect,
  viewAllHref,
}: LeaveRequestsPanelProps) {
  const [tab, setTab] = useState<"all" | LeaveStatus>("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests],
  );

  const filtered =
    tab === "all" ? requests : requests.filter((r) => r.status === tab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function selectTab(next: "all" | LeaveStatus) {
    setTab(next);
    setPage(1);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <h2 className="text-base font-semibold text-[var(--text-1)]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {monthSelect}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="rounded-md bg-[var(--navy-lt)] px-3 py-1.5 text-sm font-medium text-[var(--navy)] transition-colors hover:opacity-80"
            >
              View all
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-6 border-b border-[var(--border)] px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-[var(--orange)] text-[var(--orange)]"
                : "border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <NoRecords
          title="No requests"
          description="There's nothing to show for this filter yet."
          icon="inbox"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr>
                  {["Apprentice", "Type", "Dates", "Manager", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => {
                  const pill = STATUS_PILL[r.status];
                  const managerName =
                    managerNames[r.managerId] ?? r.managerEmail;
                  return (
                    <tr key={r.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4">
                        <PersonCell name={r.apprenticeName} role="Apprentice" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: TYPE_DOT_COLOR[r.leaveType],
                            }}
                          />
                          {r.leaveType}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {formatDate(r.startDate)}
                      </td>
                      <td className="px-5 py-4">
                        <PersonCell
                          name={managerName}
                          role="Manager"
                          tone="navy"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: pill.bg, color: pill.text }}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <MoreVertical className="ml-auto h-4 w-4 text-[var(--text-3)]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 text-sm text-[var(--text-3)]">
            <span>
              Showing {paginated.length} of {filtered.length} request
              {filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--orange)] text-xs font-semibold text-white">
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
