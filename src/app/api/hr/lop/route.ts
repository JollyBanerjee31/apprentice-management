import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getAllExtraLeaveRequests, getUserById } from "@/lib/firestore";

export async function GET() {
  const { error } = await requireRole("hr");
  if (error) return error;

  const all = await getAllExtraLeaveRequests();
  const pendingRequests = all.filter((r) => r.status === "pending");
  const historyRequests = all
    .filter((r) => r.status !== "pending")
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));

  const pending = await Promise.all(
    pendingRequests.map(async (r) => {
      const apprentice = await getUserById(r.apprenticeId);
      const stipend = apprentice?.stipend ?? 0;
      const perDay = stipend / 30;
      const estimatedDeduction = Math.round(perDay * r.noOfDays);
      return {
        ...r,
        apprenticeCode: apprentice?.apprenticeId,
        perDay,
        estimatedDeduction,
      };
    }),
  );

  return NextResponse.json({ pending, history: historyRequests });
}
