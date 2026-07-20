import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/types/index";

export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user || session.user.role !== role) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { session, error: null } as const;
}
