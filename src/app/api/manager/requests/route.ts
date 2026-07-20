import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getLeaveRequestsByManager } from "@/lib/firestore";

export async function GET() {
  const { session, error } = await requireRole("manager");
  if (error) return error;

  const requests = await getLeaveRequestsByManager(session.user.id);
  return NextResponse.json({ requests });
}
