import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { createOrUpdateStipendSlip, generatePayrollForMonth } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";
import { stipendSlipEmail } from "@/lib/email-templates";
import { MONTH_NAMES } from "@/lib/utils";

// Runs on the 1st of every month (vercel.json) — generates last month's
// payroll for every apprentice and emails them a signing link.
export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = previousMonthDate.getMonth() + 1;
  const year = previousMonthDate.getFullYear();
  const monthName = MONTH_NAMES[month - 1]!;

  const records = await generatePayrollForMonth(month, year);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  for (const record of records) {
    await createOrUpdateStipendSlip(record.apprenticeId, month, year, {
      finalPayment: record.finalPayment,
    });

    await sendEmail({
      to: record.apprenticeEmail,
      subject: `Your stipend slip for ${monthName} ${year} is ready`,
      html: stipendSlipEmail(
        record.apprenticeName,
        monthName,
        year,
        record.finalPayment,
        `${baseUrl}/apprentice/payslips`,
      ),
    });
  }

  return NextResponse.json({ success: true, count: records.length });
}
