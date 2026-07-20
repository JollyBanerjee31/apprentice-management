"use client";

import { useCallback, useEffect, useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PersonCell } from "@/components/shared/person-cell";
import { Button } from "@/components/ui/button";
import { MONTH_NAMES, formatCurrency } from "@/lib/utils";
import type { AppUser, PayrollRecord } from "@/types/index";

interface PayrollRow extends PayrollRecord {
  apprenticeCode?: string;
}

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedCount, setArchivedCount] = useState(0);

  const load = useCallback(async (m: number, y: number) => {
    setLoading(true);
    const res = await fetch(`/api/hr/payroll?month=${m}&year=${y}`);
    const data = await res.json();
    setRecords(data.records ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(month, year);
    // Only run once on mount with the initial (current) month/year;
    // subsequent loads are triggered explicitly via the Load button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/hr/apprentices")
      .then((res) => res.json())
      .then((data: { apprentices?: AppUser[] }) => {
        setArchivedCount((data.apprentices ?? []).filter((u) => u.active === false).length);
      })
      .catch(() => {});
  }, []);

  const lopCount = records.filter((r) => r.lopDays > 0).length;
  const totals = records.reduce(
    (acc, r) => ({
      stipend: acc.stipend + r.stipend,
      deduction: acc.deduction + r.deduction,
      finalPayment: acc.finalPayment + r.finalPayment,
    }),
    { stipend: 0, deduction: 0, finalPayment: 0 },
  );

  const columns: DataTableColumn<PayrollRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => <PersonCell name={r.apprenticeName} role="Apprentice" />,
    },
    {
      key: "id",
      label: "ID",
      mono: true,
      render: (r) => r.apprenticeCode ?? "—",
    },
    {
      key: "stipend",
      label: "Stipend",
      mono: true,
      render: (r) => formatCurrency(r.stipend),
    },
    { key: "regularLeave", accessor: "regularLeave", label: "Regular Leave" },
    { key: "lopDays", accessor: "lopDays", label: "LOP Days" },
    {
      key: "deduction",
      label: "Deduction",
      mono: true,
      className: "font-semibold",
      render: (r) => (
        <span className={r.deduction > 0 ? "text-[var(--danger)]" : undefined}>
          {formatCurrency(r.deduction)}
        </span>
      ),
    },
    {
      key: "finalPayment",
      label: "Final Payment",
      mono: true,
      render: (r) => (
        <span
          className={`font-bold ${r.lopDays > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
        >
          {formatCurrency(r.finalPayment)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        subtitle="Monthly salary calculations"
        action={
          <Button variant="navy" asChild>
            <a href={`/api/hr/payroll/export?month=${month}&year=${year}`}>Download Excel</a>
          </Button>
        }
      />

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button onClick={() => load(month, year)}>Load</Button>
      </div>

      {!loading && lopCount > 0 && (
        <div className="rounded-md border border-[var(--orange)]/30 bg-[var(--orange-lt)] px-4 py-3 text-sm text-[var(--orange-dk)]">
          ⚠ {lopCount} apprentice{lopCount === 1 ? "" : "s"} have LOP deductions this month.
          Payroll due on 20th {MONTH_NAMES[month - 1]} {year}.
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={records}
            rowKey={(r) => r.id}
            rowClassName={(r) => (r.lopDays > 0 ? "bg-[var(--orange-lt)]" : "")}
            emptyMessage={`No payroll data for ${MONTH_NAMES[month - 1]} ${year}. Payroll is generated automatically on the 20th of each month.`}
          />
          {records.length > 0 && (
            <div className="flex justify-end gap-8 rounded-lg border border-border bg-card px-5 py-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total Stipend: </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(totals.stipend)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Deductions: </span>
                <span className="font-mono font-semibold text-[var(--danger)]">
                  {formatCurrency(totals.deduction)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Final Payment: </span>
                <span className="font-mono font-semibold text-[var(--success)]">
                  {formatCurrency(totals.finalPayment)}
                </span>
              </div>
            </div>
          )}

          {archivedCount > 0 && (
            <div className="flex items-start gap-1.5 text-[12px] text-[#4a5068]">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Archived apprentices are excluded from payroll calculations. Their historical
                records remain in leave history.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
