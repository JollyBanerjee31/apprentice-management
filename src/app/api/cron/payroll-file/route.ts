import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { getCachedHRUsers } from "@/lib/cached-firestore";
import { buildPayrollWorkbook } from "@/lib/payroll-excel";
import { sendEmailToAllHR } from "@/lib/email";
import { payrollFileEmail } from "@/lib/email-templates";

// Runs on the 20th of every month (vercel.json) — builds the current month's
// payroll workbook (same logic as the HR "Download Excel" button) and emails
// it to every active HR user as an attachment.
export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { buffer, filename, monthName, recordCount } = await buildPayrollWorkbook(month, year);

  const hrUsers = await getCachedHRUsers();
  if (hrUsers.length === 0) {
    return NextResponse.json({ error: "No HR users found" }, { status: 400 });
  }

  await sendEmailToAllHR({
    subject: `Payroll Input File — ${monthName} ${year}`,
    html: payrollFileEmail(monthName, year, recordCount),
    attachments: [
      {
        filename,
        content: Buffer.from(buffer),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  return NextResponse.json({ success: true });
}
