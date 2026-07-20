import { auth } from "@/auth";
import { getPayrollForMonth, getStipendSlipsByApprentice } from "@/lib/firestore";
import { PageHeader } from "@/components/shared/page-header";
import { MONTH_NAMES } from "@/lib/utils";
import { PayslipsGrid, type PayslipMonth } from "./payslips-grid";

export default async function PayslipsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const months: { month: number; year: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const [slips, ...payrollByMonth] = await Promise.all([
    getStipendSlipsByApprentice(userId),
    ...months.map((m) => getPayrollForMonth(m.month, m.year)),
  ]);

  const data: PayslipMonth[] = months.map((m, i) => {
    const record = payrollByMonth[i]!.find((p) => p.apprenticeId === userId) ?? null;
    const slip = slips.find((s) => s.month === m.month && s.year === m.year) ?? null;
    return {
      month: m.month,
      year: m.year,
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      finalPayment: record?.finalPayment ?? null,
      signed: !!slip?.signedAt,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payslips" subtitle="Your monthly stipend slips for the last 6 months" />
      <PayslipsGrid months={data} />
    </div>
  );
}
