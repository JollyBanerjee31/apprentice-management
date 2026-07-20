import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getUserByApprenticeId, updateUser } from "@/lib/firestore";
import type { AppUser } from "@/types/index";

const EDITABLE_FIELDS = [
  "name",
  "apprenticeId",
  "email",
  "hireDate",
  "stipend",
  "totalLeave",
  "managerName",
  "managerEmail",
  "managerId",
] as const satisfies readonly (keyof AppUser)[];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  const update: Partial<AppUser> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      (update as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (update.apprenticeId) {
    const existing = await getUserByApprenticeId(update.apprenticeId);
    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { error: "An apprentice with this Apprentice ID already exists" },
        { status: 409 },
      );
    }
  }

  await updateUser(params.id, update);
  return NextResponse.json({ success: true });
}
