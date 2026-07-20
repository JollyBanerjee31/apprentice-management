import "server-only";
import { unstable_cache } from "next/cache";
import { getAllConfig, getAllHolidays, getAllHRUsers } from "@/lib/firestore";

// Cached wrappers for reads that are (a) hit often and (b) safe to serve
// slightly stale — genuinely fast-moving data (leave requests, user lists)
// is deliberately NOT cached here, since a stale pending count or balance
// is a real correctness bug, not just a UX nit.
//
// Call revalidateTag("holidays") / revalidateTag("config") after any
// mutation to the underlying collection so this doesn't outlive its data.

export const getCachedHolidays = unstable_cache(async () => getAllHolidays(), ["holidays"], {
  revalidate: 30,
  tags: ["holidays"],
});

export const getCachedConfig = unstable_cache(async () => getAllConfig(), ["system-config"], {
  revalidate: 30,
  tags: ["config"],
});

// HR team membership rarely changes — cached and invalidated via
// revalidateTag("hr-team") from the add/remove routes rather than relying
// only on the 60s window.
export const getCachedHRUsers = unstable_cache(async () => getAllHRUsers(), ["hr-team"], {
  revalidate: 60,
  tags: ["hr-team"],
});
