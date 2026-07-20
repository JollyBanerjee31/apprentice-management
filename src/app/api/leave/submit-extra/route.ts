import { format } from "date-fns";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createExtraLeaveRequest, getUserByEmail } from "@/lib/firestore";
import { validateExtraLeaveSubmission } from "@/lib/leave-validation";
import { sendEmail, sendEmailToAllHR } from "@/lib/email";
import { extraLeaveSubmittedApprentice, extraLeaveSubmittedHR } from "@/lib/email-templates";

export async function POST(request: Request) {
  const { session, error } = await requireRole("apprentice");
  if (error) return error;

  const body = await request.json();
  const { startDate, endDate, reason } = body;

  if (
    typeof startDate !== "string" ||
    !startDate ||
    typeof endDate !== "string" ||
    !endDate ||
    typeof reason !== "string" ||
    !reason.trim()
  ) {
    return NextResponse.json(
      { error: "Start date, end date, and reason are all required" },
      { status: 400 },
    );
  }

  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await validateExtraLeaveSubmission(user, startDate, endDate);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  const { noOfDays } = result;

  const now = new Date();
  const requestId = `EXTRA-${format(now, "yyyyMMdd-HHmmss")}-${user.id}`;

  await createExtraLeaveRequest({
    apprenticeId: user.id,
    apprenticeName: user.name,
    apprenticeEmail: user.email,
    startDate,
    endDate,
    noOfDays,
    reason,
    requestId,
    status: "pending",
    createdAt: now.toISOString(),
  });

  const perDay = user.stipend / 30;
  const estimatedDeduction = Math.round(perDay * noOfDays);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await sendEmail({
    to: user.email,
    subject: "Your extra leave request has been submitted",
    html: extraLeaveSubmittedApprentice(
      user.name,
      startDate,
      endDate,
      noOfDays,
      requestId,
      estimatedDeduction,
    ),
  });

  await sendEmailToAllHR({
    subject: `Action Required: Extra Leave (LOP) for ${user.name}`,
    html: extraLeaveSubmittedHR(
      user.name,
      startDate,
      endDate,
      noOfDays,
      reason,
      estimatedDeduction,
      `${baseUrl}/hr/lop`,
    ),
  });

  return NextResponse.json({ success: true, requestId });
}
