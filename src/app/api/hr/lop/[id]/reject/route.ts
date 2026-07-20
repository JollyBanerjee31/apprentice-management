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

  await updateExtraLeaveRequest(params.id, {
    status: "rejected",
    decidedAt: new Date().toISOString(),
  });

  const apprentice = await getUserById(extraLeaveRequest.apprenticeId);
  if (apprentice) {
    await sendEmail({
      to: apprentice.email,
      subject: "Your extra leave request has been rejected",
      html: extraLeaveDecisionApprentice(apprentice.name, "rejected", 0, 0, 0),
    });
  }

  return NextResponse.json({ success: true });
}
