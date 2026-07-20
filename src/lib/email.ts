import "server-only";
import nodemailer from "nodemailer";
import { getCachedHRUsers } from "@/lib/cached-firestore";

const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transporter =
  EMAIL_FROM && EMAIL_PASSWORD
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: EMAIL_FROM, pass: EMAIL_PASSWORD },
      })
    : null;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// Never throws — a broken mail server shouldn't take down the leave-request
// flow itself, so failures are logged and swallowed rather than propagated.
export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  if (!transporter) {
    console.warn(
      `[email] Skipped "${subject}" to ${to} — EMAIL_FROM/EMAIL_PASSWORD not configured.`,
    );
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Akamai Leave System" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments,
    });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

interface SendEmailToAllHrOptions {
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// Broadcasts to every active HR user (role === "hr") instead of a single
// configured address, so adding/removing HR admins in /hr/team is enough
// to change who gets notified — no per-callsite changes needed. Reuses
// sendEmail's never-throws guarantee per recipient, so one bad address
// can't stop the others from going out.
export async function sendEmailToAllHR({ subject, html, attachments }: SendEmailToAllHrOptions) {
  const hrUsers = await getCachedHRUsers();
  if (hrUsers.length === 0) {
    console.warn(`[email] sendEmailToAllHR: no HR users found — skipped "${subject}".`);
    return;
  }
  await Promise.all(hrUsers.map((hr) => sendEmail({ to: hr.email, subject, html, attachments })));
}
