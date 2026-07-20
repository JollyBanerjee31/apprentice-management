import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createHoliday, getAllHolidays } from "@/lib/firestore";
import { dayOfWeek } from "@/lib/utils";

export async function GET() {
  const { error } = await requireRole("hr");
  if (error) return error;

  const holidays = await getAllHolidays();
  return NextResponse.json({ holidays });
}

export async function POST(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  const { date, name, comments } = body;

  if (typeof date !== "string" || !date || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Date and holiday name are required" }, { status: 400 });
  }

  const id = await createHoliday({
    date,
    name,
    day: dayOfWeek(date)!,
    ...(comments ? { comments } : {}),
  });
  revalidateTag("holidays");

  return NextResponse.json({ id, success: true });
}
