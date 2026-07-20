// Shared by (dashboard)/hr, /manager, and /apprentice loading.tsx files —
// all three dashboards share the same 4 stat cards + table/list content
// shape, so one skeleton covers all of them. Uses the shimmering `.skeleton`
// utility (globals.css) rather than a flat `bg-muted` block, which was
// nearly invisible against the page background.
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-6 w-64" />
        <div className="skeleton h-4 w-48" />
      </div>

      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#eaedf5] bg-white p-5">
            <div className="skeleton mb-3 h-3 w-20" />
            <div className="skeleton mb-2 h-8 w-16" />
            <div className="skeleton h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#eaedf5] bg-white lg:col-span-2">
          <div className="border-b border-[#eaedf5] p-5">
            <div className="skeleton h-4 w-40" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-[#eaedf5] px-5 py-4 last:border-0"
            >
              <div className="skeleton h-4 w-1/4" />
              <div className="skeleton h-4 w-1/5" />
              <div className="skeleton h-4 w-1/6" />
              <div className="skeleton h-4 w-1/6" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#eaedf5] bg-white p-5">
            <div className="skeleton mb-3 h-4 w-24" />
            <div className="skeleton h-20 w-full" />
          </div>
          <div className="rounded-xl border border-[#eaedf5] bg-white p-5">
            <div className="skeleton mb-3 h-4 w-24" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
