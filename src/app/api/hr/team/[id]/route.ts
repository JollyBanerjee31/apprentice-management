import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/api-auth";
import { updateUser } from "@/lib/firestore";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole("hr");
  if (error) return error;

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself from the HR team" },
      { status: 400 },
    );
  }

  // Downgrade rather than delete — keeps the Firestore doc (and its history)
  // around, just strips dashboard access. See the Role type comment.
  await updateUser(params.id, { role: "none" });
  revalidateTag("hr-team");

  return NextResponse.json({ success: true });
}
