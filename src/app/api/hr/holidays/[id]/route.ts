import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { deleteHoliday, updateHoliday } from "@/lib/firestore";
import { dayOfWeek } from "@/lib/utils";
import type { Holiday } from "@/types/index";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  const update: Partial<Holiday> = {};

  if (typeof body.date === "string" && body.date) {
    update.date = body.date;
    update.day = dayOfWeek(body.date)!;
  }
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name;
  }
  if (typeof body.comments === "string") {
    update.comments = body.comments;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await updateHoliday(params.id, update);
  revalidateTag("holidays");
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("hr");
  if (error) return error;

  await deleteHoliday(params.id);
  revalidateTag("holidays");
  return NextResponse.json({ success: true });
}
