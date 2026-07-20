import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import {
  createUser,
  getAllUsers,
  getUserByApprenticeId,
  getUserByEmail,
} from "@/lib/firestore";
import type { AppUser } from "@/types/index";

export async function GET() {
  const { error } = await requireRole("hr");
  if (error) return error;

  const users = await getAllUsers();
  const apprentices = users
    .filter((u) => u.role === "apprentice")
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ apprentices });
}

export async function POST(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  const { name, apprenticeId, email, hireDate, stipend, totalLeave, managerName, managerEmail } =
    body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof apprenticeId !== "string" ||
    !apprenticeId.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof hireDate !== "string" ||
    !hireDate ||
    typeof managerName !== "string" ||
    !managerName.trim() ||
    typeof managerEmail !== "string" ||
    !managerEmail.trim()
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof stipend !== "number" || typeof totalLeave !== "number") {
    return NextResponse.json(
      { error: "Stipend and total leave days must be numbers" },
      { status: 400 },
    );
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const existingApprenticeId = await getUserByApprenticeId(apprenticeId);
  if (existingApprenticeId) {
    return NextResponse.json(
      { error: "An apprentice with this Apprentice ID already exists" },
      { status: 409 },
    );
  }

  const manager = await getUserByEmail(managerEmail);

  const userData: Omit<AppUser, "id"> = {
    name,
    apprenticeId,
    email,
    role: "apprentice",
    hireDate,
    stipend,
    totalLeave,
    managerName,
    managerEmail,
    createdAt: new Date().toISOString(),
  };
  // Firestore rejects explicit `undefined` values, so only set managerId
  // when we actually resolved a matching manager account.
  if (manager?.role === "manager") {
    userData.managerId = manager.id;
  }

  const id = await createUser(userData);

  return NextResponse.json({ id, success: true });
}
