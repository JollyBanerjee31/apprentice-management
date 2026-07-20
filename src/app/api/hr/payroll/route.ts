import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { generatePayrollForMonth, getUserById } from "@/lib/firestore";

export async function GET(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  // Recomputes and persists payroll for every apprentice for this
  // month/year — the "Load" button doubles as the (currently manual)
  // trigger a real cron job would call on the 20th.
  const records = (await generatePayrollForMonth(month, year)).sort((a, b) =>
    a.apprenticeName.localeCompare(b.apprenticeName),
  );

  const withIds = await Promise.all(
    records.map(async (r) => ({
      ...r,
      apprenticeCode: (await getUserById(r.apprenticeId))?.apprenticeId ?? r.apprenticeId,
    })),
  );

  return NextResponse.json({ records: withIds, month, year });
}
