import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getUserById, updateUser } from "@/lib/firestore";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole("hr");
  if (error) return error;

  const user = await getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: "Apprentice not found" }, { status: 404 });
  }
  if (user.role !== "apprentice") {
    return NextResponse.json({ error: "Can only archive apprentices" }, { status: 400 });
  }

  await updateUser(params.id, {
    active: false,
    archivedAt: new Date().toISOString(),
    archivedBy: session.user.id,
  });

  return NextResponse.json({ success: true });
}
