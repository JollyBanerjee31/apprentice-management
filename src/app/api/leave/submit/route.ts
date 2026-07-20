import { format } from "date-fns";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createLeaveRequest, getTotalUsedLeave, getUserByEmail } from "@/lib/firestore";
import { validateLeaveSubmission } from "@/lib/leave-validation";
import { sendEmail } from "@/lib/email";
import { leaveSubmittedApprentice, leaveSubmittedManager } from "@/lib/email-templates";
import type { LeaveType } from "@/types/index";

const VALID_LEAVE_TYPES: LeaveType[] = ["Casual/Sick Leave", "Annual Leave"];

export async function POST(request: Request) {
  const { session, error } = await requireRole("apprentice");
  if (error) return error;

  const body = await request.json();
  const { leaveType, startDate, endDate } = body;

  if (
    !VALID_LEAVE_TYPES.includes(leaveType) ||
    typeof startDate !== "string" ||
    !startDate ||
    typeof endDate !== "string" ||
    !endDate
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.managerId || !user.managerEmail) {
    return NextResponse.json(
      { error: "No manager is linked to your account yet — contact HR" },
      { status: 400 },
    );
  }

  const result = await validateLeaveSubmission(user, startDate, endDate);
  if (!result.ok) {
    return NextResponse.json(result.error, { status: 409 });
  }
  const { noOfDays } = result;

  const now = new Date();
  const requestId = `REQ-${format(now, "yyyyMMdd-HHmmss")}-${user.id}`;

  await createLeaveRequest({
    apprenticeId: user.id,
    apprenticeName: user.name,
    apprenticeEmail: user.email,
    managerId: user.managerId,
    managerEmail: user.managerEmail,
    leaveType: leaveType as LeaveType,
    startDate,
    endDate,
    noOfDays,
    requestId,
    status: "pending",
    createdAt: now.toISOString(),
  });

  const usedLeave = await getTotalUsedLeave(user.id);
  const newBalance = user.totalLeave - usedLeave;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await sendEmail({
    to: user.email,
    subject: "Your leave request has been submitted",
    html: leaveSubmittedApprentice(user.name, leaveType, startDate, requestId, newBalance),
  });

  await sendEmail({
    to: user.managerEmail,
    subject: `${user.name} requested leave — approval needed`,
    html: leaveSubmittedManager(
      user.managerName ?? "Manager",
      user.name,
      leaveType,
      startDate,
      requestId,
      `${baseUrl}/manager/approvals`,
      `${baseUrl}/manager/approvals`,
    ),
  });

  return NextResponse.json({ success: true, requestId });
}
