import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/api-auth";
import { createUser, getUserByEmail, updateUser } from "@/lib/firestore";
import { getCachedHRUsers } from "@/lib/cached-firestore";
import { sendEmail } from "@/lib/email";
import { hrTeamWelcomeEmail } from "@/lib/email-templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET() {
  const { session, error } = await requireRole("hr");
  if (error) return error;

  const hrUsers = (await getCachedHRUsers()).sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ hrUsers, currentUserId: session.user.id });
}

export async function POST(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  const { name, email } = body;

  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid name and email are required" }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    await updateUser(existing.id, { role: "hr" });
    revalidateTag("hr-team");
    await sendEmail({
      to: existing.email,
      subject: "You've been added to the Akamai Leave System HR team",
      html: hrTeamWelcomeEmail(existing.name, `${BASE_URL}/hr`),
    });
    return NextResponse.json({ success: true, message: "Existing user promoted to HR" });
  }

  const id = await createUser({
    name,
    email,
    role: "hr",
    stipend: 0,
    totalLeave: 0,
    hireDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  revalidateTag("hr-team");
  await sendEmail({
    to: email,
    subject: "You've been added to the Akamai Leave System HR team",
    html: hrTeamWelcomeEmail(name, `${BASE_URL}/hr`),
  });
  return NextResponse.json({ success: true, id, message: "New HR user created" });
}
