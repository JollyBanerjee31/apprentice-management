import "server-only";
import ExcelJS from "exceljs";
import { generatePayrollForMonth, getUserById } from "@/lib/firestore";
import { MONTH_NAMES } from "@/lib/utils";

const NAVY = "FF00146C";
const WHITE = "FFFFFFFF";
const ROW_ALT = "FFF2F7FC";
const LOP_ROW = "FFFFF8E1";
const GREEN = "FF1A6E3A";
const RED = "FFA01C1C";
const GREY_BORDER = "FFD5D9E5";

export interface PayrollWorkbookResult {
  buffer: ExcelJS.Buffer;
  filename: string;
  monthName: string;
  year: number;
  recordCount: number;
}

// Shared by the HR-triggered download (app/api/hr/payroll/export) and the
// 20th-of-the-month cron job (app/api/cron/payroll-file) so both produce the
// exact same workbook rather than maintaining two copies of this styling.
export async function buildPayrollWorkbook(
  month: number,
  year: number,
): Promise<PayrollWorkbookResult> {
  const monthName = MONTH_NAMES[month - 1]!;

  const records = (await generatePayrollForMonth(month, year)).sort((a, b) =>
    a.apprenticeName.localeCompare(b.apprenticeName),
  );
  const withIds = await Promise.all(
    records.map(async (r) => ({
      ...r,
      apprenticeCode: (await getUserById(r.apprenticeId))?.apprenticeId ?? r.apprenticeId,
    })),
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Payroll ${monthName} ${year}`);

  const columns = [
    { header: "ID", width: 110 / 7 },
    { header: "Name", width: 160 / 7 },
    { header: "Email", width: 200 / 7 },
    { header: "Regular Leave", width: 100 / 7 },
    { header: "LOP Days", width: 120 / 7 },
    { header: "Stipend", width: 110 / 7 },
    { header: "Deduction", width: 130 / 7 },
    { header: "Final Payment", width: 130 / 7 },
  ];
  sheet.columns = columns.map((c) => ({ width: c.width }));

  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Payroll — ${monthName} ${year}`;
  titleCell.font = { color: { argb: WHITE }, bold: true, size: 14 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 28;

  const headerRow = sheet.getRow(2);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { color: { argb: WHITE }, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  withIds.forEach((r, index) => {
    const row = sheet.getRow(index + 3);
    row.values = [
      r.apprenticeCode,
      r.apprenticeName,
      r.apprenticeEmail,
      r.regularLeave,
      r.lopDays,
      r.stipend,
      r.deduction,
      r.finalPayment,
    ];

    const hasLop = r.lopDays > 0;
    const bgColor = hasLop ? LOP_ROW : index % 2 === 0 ? "FFFFFFFF" : ROW_ALT;
    for (let col = 1; col <= columns.length; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.border = {
        top: { style: "thin", color: { argb: GREY_BORDER } },
        bottom: { style: "thin", color: { argb: GREY_BORDER } },
        left: { style: "thin", color: { argb: GREY_BORDER } },
        right: { style: "thin", color: { argb: GREY_BORDER } },
      };
    }

    const finalPayCell = row.getCell(8);
    finalPayCell.font = { bold: true, color: { argb: hasLop ? RED : GREEN } };
  });

  const lastDataRow = withIds.length + 2;
  const outerBorderStyle = { style: "medium" as const, color: { argb: NAVY } };
  for (let col = 1; col <= columns.length; col++) {
    sheet.getRow(2).getCell(col).border = {
      ...sheet.getRow(2).getCell(col).border,
      top: outerBorderStyle,
    };
    sheet.getRow(lastDataRow).getCell(col).border = {
      ...sheet.getRow(lastDataRow).getCell(col).border,
      bottom: outerBorderStyle,
    };
  }
  for (let row = 2; row <= lastDataRow; row++) {
    sheet.getRow(row).getCell(1).border = {
      ...sheet.getRow(row).getCell(1).border,
      left: outerBorderStyle,
    };
    sheet.getRow(row).getCell(columns.length).border = {
      ...sheet.getRow(row).getCell(columns.length).border,
      right: outerBorderStyle,
    };
  }

  const footerRow = sheet.getRow(lastDataRow + 2);
  sheet.mergeCells(footerRow.number, 1, footerRow.number, columns.length);
  const footerCell = footerRow.getCell(1);
  footerCell.value = `Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  footerCell.font = { italic: true, size: 9, color: { argb: "FF9299B0" } };

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer,
    filename: `Payroll_${monthName}_${year}.xlsx`,
    monthName,
    year,
    recordCount: withIds.length,
  };
}
