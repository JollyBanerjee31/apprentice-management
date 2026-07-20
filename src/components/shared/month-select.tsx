"use client";

import { usePathname, useRouter } from "next/navigation";
import { MONTH_NAMES } from "@/lib/utils";

interface MonthSelectProps {
  month: number;
  year: number;
}

export function MonthSelect({ month, year }: MonthSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const years = [year - 1, year, year + 1];

  function navigate(nextMonth: number, nextYear: number) {
    router.push(`${pathname}?month=${nextMonth}&year=${nextYear}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => navigate(Number(e.target.value), year)}
        className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => navigate(month, Number(e.target.value))}
        className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
