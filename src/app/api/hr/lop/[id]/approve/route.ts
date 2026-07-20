import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getExtraLeaveRequestById, getUserById, updateExtraLeaveRequest } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";
import { extraLeaveDecisionApprentice } from "@/lib/email-templates";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const extraLeaveRequest = await getExtraLeaveRequestById(params.id);
  if (!extraLeaveRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (extraLeaveRequest.status !== "pending") {
    return NextResponse.json({ error: "Request has already been decided" }, { status: 409 });
  }

  const apprentice = await getUserById(extraLeaveRequest.apprenticeId);
  if (!apprentice) {
    return NextResponse.json({ error: "Apprentice not found" }, { status: 404 });
  }

  const perDay = apprentice.stipend / 30;
  const deduction = Math.round(perDay * extraLeaveRequest.noOfDays);
  const finalPayment = apprentice.stipend - deduction;

  await updateExtraLeaveRequest(params.id, {
    status: "approved",
    decidedAt: new Date().toISOString(),
    lopDays: extraLeaveRequest.noOfDays,
    deduction,
    finalPayment,
  });

  await sendEmail({
    to: apprentice.email,
    subject: "Your extra leave request has been approved",
    html: extraLeaveDecisionApprentice(
      apprentice.name,
      "approved",
      extraLeaveRequest.noOfDays,
      deduction,
      finalPayment,
    ),
  });

  return NextResponse.json({ success: true });
}
