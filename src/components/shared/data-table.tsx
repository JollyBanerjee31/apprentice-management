import { memo } from "react";
import { NoRecords, type NoRecordsProps } from "@/components/shared/no-records";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  accessor?: keyof T & string;
  render?: (row: T) => React.ReactNode;
  mono?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Simple fallback: shown as the NoRecords description under a generic title. */
  emptyMessage?: string;
  /** Full NoRecords config, for pages that want a tailored empty state. */
  emptyState?: NoRecordsProps;
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string;
}

// columns/render props are usually redefined inline by callers (a new
// reference every render), so memo mainly pays off for tables whose parent
// re-renders for unrelated reasons while columns/data stay referentially
// stable (e.g. wrapped in useMemo) — it's a no-op, not a regression, otherwise.
function DataTableInner<T>({
  columns,
  data,
  emptyMessage,
  emptyState,
  rowKey,
  rowClassName,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <NoRecords
          {...(emptyState ?? {
            title: "No records found",
            description: emptyMessage ?? "There's nothing here yet.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="bg-background">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9299b0]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className={`border-t border-border hover:bg-[#fafbfd] ${rowClassName?.(row) ?? ""}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.mono ? "font-mono" : ""} ${col.className ?? ""}`}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.accessor ?? col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
