import { requireRole } from "@/lib/api-auth";
import { buildPayrollWorkbook } from "@/lib/payroll-excel";

export async function GET(request: Request) {
  const { error } = await requireRole("hr");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  const { buffer, filename } = await buildPayrollWorkbook(month, year);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
