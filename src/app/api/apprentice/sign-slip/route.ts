import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createOrUpdateStipendSlip, getPayrollForMonth, getUserById } from "@/lib/firestore";
import { sendEmailToAllHR } from "@/lib/email";
import { stipendAcknowledgedHR } from "@/lib/email-templates";
import { generateStipendSlipPdf } from "@/lib/generate-stipend-pdf";
import { MONTH_NAMES } from "@/lib/utils";

// Signature is stored inline as a data URL on the Firestore doc (no Cloud
// Storage configured for this project) — keep it comfortably under
// Firestore's 1MiB document size limit.
const MAX_SIGNATURE_LENGTH = 800_000;

export async function POST(request: Request) {
  const { session, error } = await requireRole("apprentice");
  if (error) return error;

  const body = await request.json();
  const { month, year, signatureDataUrl } = body;

  if (
    typeof month !== "number" ||
    typeof year !== "number" ||
    typeof signatureDataUrl !== "string" ||
    !signatureDataUrl.startsWith("data:image/")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (signatureDataUrl.length > MAX_SIGNATURE_LENGTH) {
    return NextResponse.json({ error: "Signature image is too large" }, { status: 400 });
  }

  const userId = session.user.id;
  const payroll = await getPayrollForMonth(month, year);
  const record = payroll.find((p) => p.apprenticeId === userId);
  if (!record) {
    return NextResponse.json(
      { error: "Payroll for this month hasn't been generated yet" },
      { status: 404 },
    );
  }

  const signedAt = new Date().toISOString();
  await createOrUpdateStipendSlip(userId, month, year, {
    finalPayment: record.finalPayment,
    signedAt,
    signatureUrl: signatureDataUrl,
  });

  const apprentice = await getUserById(userId);
  if (apprentice) {
    // The signature is already saved above — a PDF/email failure here
    // shouldn't turn into a 500 for an apprentice who successfully signed.
    try {
      const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
      const pdfBuffer = await generateStipendSlipPdf({
        apprenticeName: apprentice.name,
        apprenticeId: apprentice.apprenticeId,
        apprenticeEmail: apprentice.email,
        hireDate: apprentice.hireDate,
        monthLabel,
        stipend: record.stipend,
        regularLeave: record.regularLeave,
        lopDays: record.lopDays,
        deduction: record.deduction,
        finalPayment: record.finalPayment,
        signatureDataUrl,
        signedAt,
      });

      await sendEmailToAllHR({
        subject: `Stipend Acknowledged — ${apprentice.name}${apprentice.apprenticeId ? ` (${apprentice.apprenticeId})` : ""}`,
        html: stipendAcknowledgedHR(apprentice.name, monthLabel, record.finalPayment),
        attachments: [
          {
            filename: `${apprentice.name.replace(/\s+/g, "_")}_${apprentice.apprenticeId ?? apprentice.id}_${monthLabel.replace(/\s+/g, "_")}_StipendSlip.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (err) {
      console.error("[sign-slip] Failed to generate/send stipend slip PDF:", err);
    }
  }

  return NextResponse.json({ success: true });
}
