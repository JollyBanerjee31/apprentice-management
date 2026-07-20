"use client";

import { usePathname, useRouter } from "next/navigation";

interface YearSelectProps {
  year: number;
  years?: number[];
}

export function YearSelect({ year, years }: YearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const options = years ?? [year - 1, year, year + 1];

  return (
    <select
      value={year}
      onChange={(e) => router.push(`${pathname}?year=${e.target.value}`)}
      className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
