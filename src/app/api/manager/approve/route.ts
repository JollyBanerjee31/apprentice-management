import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getLeaveRequestById, getTotalUsedLeave, getUserById, updateLeaveRequest } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";
import { leaveDecisionApprentice } from "@/lib/email-templates";

export async function POST(request: Request) {
  const { session, error } = await requireRole("manager");
  if (error) return error;

  const body = await request.json();
  const { leaveRequestId } = body;
  if (typeof leaveRequestId !== "string" || !leaveRequestId) {
    return NextResponse.json({ error: "leaveRequestId is required" }, { status: 400 });
  }

  const leaveRequest = await getLeaveRequestById(leaveRequestId);
  if (!leaveRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (leaveRequest.managerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (leaveRequest.status !== "pending") {
    return NextResponse.json({ error: "Request has already been decided" }, { status: 409 });
  }

  await updateLeaveRequest(leaveRequestId, {
    status: "approved",
    decidedAt: new Date().toISOString(),
  });

  const apprentice = await getUserById(leaveRequest.apprenticeId);
  const usedLeave = await getTotalUsedLeave(leaveRequest.apprenticeId);
  const newBalance = (apprentice?.totalLeave ?? 0) - usedLeave;

  if (apprentice) {
    await sendEmail({
      to: apprentice.email,
      subject: "Your leave request has been approved",
      html: leaveDecisionApprentice(
        apprentice.name,
        "approved",
        leaveRequest.leaveType,
        leaveRequest.startDate,
        newBalance,
      ),
    });
  }

  return NextResponse.json({ success: true, newBalance });
}
