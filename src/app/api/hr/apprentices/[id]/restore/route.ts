import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getUserById, updateUser } from "@/lib/firestore";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const user = await getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: "Apprentice not found" }, { status: 404 });
  }

  await updateUser(params.id, {
    active: true,
    archivedAt: null,
    archivedBy: null,
  });

  return NextResponse.json({ success: true });
}
