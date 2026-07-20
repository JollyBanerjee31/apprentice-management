import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getAllConfig, setConfig } from "@/lib/firestore";

export async function GET() {
  const { error } = await requireRole("hr");
  if (error) return error;

  const config = await getAllConfig();
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const body = await request.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid config payload" }, { status: 400 });
  }

  const entries = Object.entries(body).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  await Promise.all(entries.map(([key, value]) => setConfig(key, value)));
  revalidateTag("config");

  return NextResponse.json({ success: true });
}
