import { formatCurrency, formatDate } from "@/lib/utils";

function emailWrapper(content: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:#f4f6fb;padding:32px 0;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0"
    style="background:#fff;border-radius:8px;
    box-shadow:0 2px 8px rgba(0,20,108,.08);">
    <tr>
      <td style="background:#00146c;padding:24px 32px;
        border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
          Akamai Leave System
        </h1>
      </td>
    </tr>
    <tr><td style="padding:32px;">${content}</td></tr>
    <tr>
      <td style="background:#f8f8fb;padding:16px 32px;
        border-top:1px solid #e8e8ee;border-radius:0 0 8px 8px;">
        <p style="margin:0;color:#999;font-size:12px;">
          This is an automated email from the Akamai Leave System.
          Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
  </td></tr>
  </table>
  </body>
  </html>`;
}

function greeting(name: string, lead: string) {
  return `<p style="margin:0 0 16px;color:#0a0a1a;font-size:15px;">Hi ${name},</p>
  <p style="margin:0 0 20px;color:#0a0a1a;font-size:15px;line-height:1.5;">${lead}</p>`;
}

function infoTable(rows: [string, string][]) {
  const body = rows
    .map(
      ([label, value], i) => `
      <tr style="background:${i % 2 === 0 ? "#f8f8fb" : "#ffffff"};">
        <td style="padding:10px 14px;color:#5a607a;font-size:13px;width:40%;">${label}</td>
        <td style="padding:10px 14px;color:#0a0a1a;font-size:13px;font-weight:600;">${value}</td>
      </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e7f0;border-radius:6px;overflow:hidden;margin:0 0 20px;">${body}</table>`;
}

function ctaButton(url: string, label: string, color = "#ff8b00") {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td style="border-radius:6px;background:${color};">
      <a href="${url}" style="display:inline-block;padding:12px 24px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

function statusBadge(status: "approved" | "rejected") {
  const isApproved = status === "approved";
  const bg = isApproved ? "#e8f8ee" : "#fdecea";
  const color = isApproved ? "#1a6e3a" : "#a01c1c";
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${bg};color:${color};font-size:13px;font-weight:600;">${isApproved ? "Approved" : "Rejected"}</span>`;
}

// 1. Confirms a regular leave submission to the apprentice.
export function leaveSubmittedApprentice(
  name: string,
  leaveType: string,
  startDate: string,
  requestId: string,
  balance: number,
) {
  return emailWrapper(`
    ${greeting(name, "Your leave request has been submitted and is awaiting your manager's approval.")}
    ${infoTable([
      ["Leave Type", leaveType],
      ["Date", formatDate(startDate)],
      ["Request ID", requestId],
      ["Remaining Balance", `${balance} day${balance === 1 ? "" : "s"}`],
    ])}
    <p style="margin:0;color:#5a607a;font-size:13px;">We'll email you as soon as a decision is made.</p>
  `);
}

// 2. Notifies the manager that an apprentice submitted a leave request.
export function leaveSubmittedManager(
  managerName: string,
  apprenticeName: string,
  leaveType: string,
  startDate: string,
  requestId: string,
  approveUrl: string,
  rejectUrl: string,
) {
  return emailWrapper(`
    ${greeting(managerName, `${apprenticeName} has requested leave and needs your approval.`)}
    ${infoTable([
      ["Apprentice", apprenticeName],
      ["Leave Type", leaveType],
      ["Date", formatDate(startDate)],
      ["Request ID", requestId],
    ])}
    ${ctaButton(approveUrl, "Approve", "#1a6e3a")}
    ${ctaButton(rejectUrl, "Reject", "#a01c1c")}
  `);
}

// 3. Tells the apprentice their regular leave request was approved/rejected.
export function leaveDecisionApprentice(
  name: string,
  decision: "approved" | "rejected",
  leaveType: string,
  startDate: string,
  balance: number,
) {
  return emailWrapper(`
    ${greeting(name, `Your leave request has been ${decision}.`)}
    <div style="margin:0 0 20px;">${statusBadge(decision)}</div>
    ${infoTable([
      ["Leave Type", leaveType],
      ["Date", formatDate(startDate)],
      ["Remaining Balance", `${balance} day${balance === 1 ? "" : "s"}`],
    ])}
  `);
}

// 4. Blocks a leave request because the date falls on a public holiday.
export function holidayBlockEmail(
  name: string,
  date: string,
  holidayName: string,
  hrTicketLink: string,
) {
  return emailWrapper(`
    ${greeting(name, `We couldn't submit your leave request because ${formatDate(date)} is already a public holiday (${holidayName}), so no leave day is needed.`)}
    <p style="margin:0 0 20px;color:#5a607a;font-size:13px;">If you believe this is a mistake, please raise a ticket with HR.</p>
    ${ctaButton(hrTicketLink, "Contact HR")}
  `);
}

// 5. Blocks a leave request because the monthly limit was already used.
export function monthlyLimitEmail(
  name: string,
  noOfDays: number,
  hrTicketLink: string,
  extraLeaveUrl: string,
) {
  return emailWrapper(`
    ${greeting(name, `We couldn't submit your leave request — only ${noOfDays} day of leave is allowed per calendar month, and you've already used this month's allowance.`)}
    <p style="margin:0 0 20px;color:#5a607a;font-size:13px;">If you need additional time off this month, you can apply for Extra Leave (Loss of Pay) instead.</p>
    ${ctaButton(extraLeaveUrl, "Apply for Extra Leave")}
    <p style="margin:16px 0 0;color:#5a607a;font-size:13px;">Questions? <a href="${hrTicketLink}" style="color:#00146c;">Contact HR</a>.</p>
  `);
}

// 6. Blocks a leave request because the annual balance is exhausted.
export function balanceExhaustedEmail(
  name: string,
  totalLeave: number,
  hrTicketLink: string,
  extraLeaveUrl: string,
) {
  return emailWrapper(`
    ${greeting(name, `We couldn't submit your leave request — you've used all ${totalLeave} of your leave days for this period.`)}
    <p style="margin:0 0 20px;color:#5a607a;font-size:13px;">You can still apply for Extra Leave (Loss of Pay) if you need time off.</p>
    ${ctaButton(extraLeaveUrl, "Apply for Extra Leave")}
    <p style="margin:16px 0 0;color:#5a607a;font-size:13px;">Questions? <a href="${hrTicketLink}" style="color:#00146c;">Contact HR</a>.</p>
  `);
}

// 7. Confirms an extra-leave (LOP) submission to the apprentice.
export function extraLeaveSubmittedApprentice(
  name: string,
  startDate: string,
  endDate: string,
  noOfDays: number,
  requestId: string,
  estimatedDeduction: number,
) {
  return emailWrapper(`
    ${greeting(name, "Your extra leave (Loss of Pay) request has been submitted and is awaiting HR approval.")}
    ${infoTable([
      ["Dates", `${formatDate(startDate)} – ${formatDate(endDate)}`],
      ["Days", String(noOfDays)],
      ["Request ID", requestId],
      // ["Estimated Deduction", formatCurrency(estimatedDeduction)],
    ])}
    <p style="margin:0;color:#5a607a;font-size:13px;">We'll email you as soon as a decision is made.</p>
  `);
}

// 8. Notifies HR that an apprentice submitted an extra-leave (LOP) request.
export function extraLeaveSubmittedHR(
  apprenticeName: string,
  startDate: string,
  endDate: string,
  noOfDays: number,
  reason: string,
  deduction: number,
  approveUrl: string,
) {
  return emailWrapper(`
    ${greeting("HR Team", `${apprenticeName} has requested extra leave (Loss of Pay) and needs your approval.`)}
    ${infoTable([
      ["Apprentice", apprenticeName],
      ["Dates", `${formatDate(startDate)} – ${formatDate(endDate)}`],
      ["Days", String(noOfDays)],
      ["Reason", reason],
      ["Estimated Deduction", formatCurrency(deduction)],
    ])}
    ${ctaButton(approveUrl, "Review Request")}
  `);
}

// 9. Tells the apprentice their extra-leave (LOP) request was decided.
export function extraLeaveDecisionApprentice(
  name: string,
  decision: "approved" | "rejected",
  lopDays: number,
  deduction: number,
  finalPayment: number,
) {
  const details =
    decision === "approved"
      ? infoTable([
          ["LOP Days", String(lopDays)],
          // ["Deduction", formatCurrency(deduction)],
          // ["Revised Final Payment", formatCurrency(finalPayment)],
        ])
      : "";
  return emailWrapper(`
    ${greeting(name, `Your extra leave (Loss of Pay) request has been ${decision}.`)}
    <div style="margin:0 0 20px;">${statusBadge(decision)}</div>
    ${details}
  `);
}

// 10. Sends the apprentice their stipend slip for signature.
export function stipendSlipEmail(
  name: string,
  month: string,
  year: number,
  finalPayment: number,
  signUrl: string,
) {
  return emailWrapper(`
    ${greeting(name, `Your stipend slip for ${month} ${year} is ready.`)}
    ${infoTable([
      ["Period", `${month} ${year}`],
      ["Final Payment", formatCurrency(finalPayment)],
    ])}
    ${ctaButton(signUrl, "Sign Stipend Slip")}
  `);
}

// 11. Notifies HR that an apprentice signed and acknowledged their stipend slip.
export function stipendAcknowledgedHR(apprenticeName: string, month: string, finalPayment: number) {
  return emailWrapper(`
    ${greeting("HR Team", `${apprenticeName} has signed and acknowledged receipt of their stipend. The signed stipend slip is attached to this email as a PDF.`)}
    ${infoTable([
      ["Apprentice", apprenticeName],
      ["Period", month],
      ["Final Payment", formatCurrency(finalPayment)],
    ])}
  `);
}

// 12. Notifies HR that the monthly payroll Excel file is attached (cron job).
export function payrollFileEmail(month: string, year: number, apprenticeCount: number) {
  return emailWrapper(`
    ${greeting("HR Team", `Payroll for ${month} ${year} has been generated and is attached as an Excel file.`)}
    ${infoTable([
      ["Period", `${month} ${year}`],
      ["Apprentices", String(apprenticeCount)],
    ])}
    <p style="margin:0;color:#5a607a;font-size:13px;">This file was generated automatically on the 20th of the month.</p>
  `);
}

// 13. Welcomes a newly added/promoted HR admin (sent to them individually,
// not broadcast via sendEmailToAllHR).
export function hrTeamWelcomeEmail(name: string, dashboardUrl: string) {
  return emailWrapper(`
    ${greeting(name, "You've been added as an HR Administrator on the Akamai Leave System.")}
    <p style="margin:0 0 20px;color:#5a607a;font-size:13px;line-height:1.5;">
      Sign in with your Google account to access the full HR dashboard — apprentice records,
      leave and extra-leave approvals, payroll, and system configuration. You'll also receive
      all HR notification emails going forward, alongside the rest of the HR team.
    </p>
    ${ctaButton(dashboardUrl, "Go to HR Dashboard", "#00146c")}
  `);
}
