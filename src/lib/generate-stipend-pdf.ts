import "server-only";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

// pdfkit's built-in Helvetica uses the base WinAnsi encoding, which predates
// Unicode 6.0's 2010 addition of ₹ — the glyph silently renders as garbage.
// Spelling out "INR" is the standard workaround PDF tooling uses for this.
function formatCurrencyForPdf(amount: number) {
  return `INR ${Math.round(amount).toLocaleString("en-IN")}`;
}

// Pre-rasterized from public/akamai-logo.svg (480x196) — pdfkit's own
// doc.image()/fit sizing is reliable, unlike svg-to-pdfkit's transform
// handling, which didn't respect an externally-applied doc.scale().
const LOGO_INTRINSIC_WIDTH = 480;
const LOGO_INTRINSIC_HEIGHT = 196;

const COLORS = {
  text1: "#0a0a1a",
  text2: "#4a5068",
  text3: "#9299b0",
  border: "#e2e8f0",
  success: "#16a34a",
};

interface StipendSlipPdfInput {
  apprenticeName: string;
  apprenticeId?: string;
  apprenticeEmail: string;
  hireDate: string;
  monthLabel: string;
  stipend: number;
  regularLeave: number;
  lopDays: number;
  deduction: number;
  finalPayment: number;
  signatureDataUrl: string;
  signedAt: string;
}

function formatDatePart(dateStr: string, withTime = false) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const datePart = `${day}-${month}-${year}`;
  if (!withTime) return datePart;
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

function decodeSignature(dataUrl: string): Buffer {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Buffer.from(base64, "base64");
}

export async function generateStipendSlipPdf(input: StipendSlipPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;

  // ── Letterhead: Akamai logo + title ──────────────────────────────
  const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "akamai-logo-pdf.png"));
  const logoTargetWidth = 90;
  const logoHeight = (LOGO_INTRINSIC_HEIGHT / LOGO_INTRINSIC_WIDTH) * logoTargetWidth;
  doc.image(logoBuffer, marginX, 45, { fit: [logoTargetWidth, logoHeight] });
  const titleY = 45 + logoHeight + 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.text3)
    .text("Apprentice Leave System", marginX, titleY);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(COLORS.text3)
    .text(`Stipend Slip — ${input.monthLabel}`, marginX, titleY + 22);

  // ── Bordered card ─────────────────────────────────────────────────
  const cardX = marginX;
  const cardPad = 24;
  const cardTop = 150;
  doc.y = cardTop + cardPad;
  doc.x = cardX + cardPad;
  const innerWidth = contentWidth - cardPad * 2;

  function sectionHeading(label: string) {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.text1)
      .text(label, cardX + cardPad, doc.y, { width: innerWidth });
    doc.moveDown(0.6);
  }

  function detailRow(label: string, value: string) {
    const y = doc.y;
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.text2)
      .text(label, cardX + cardPad, y, { width: innerWidth * 0.4 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.text1)
      .text(value, cardX + cardPad, y, { width: innerWidth, align: "right" });
    doc.moveDown(0.9);
    doc
      .moveTo(cardX + cardPad, doc.y)
      .lineTo(cardX + contentWidth - cardPad, doc.y)
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .stroke();
    doc.moveDown(0.6);
  }

  function salaryRow(desc: string, days: string, amount: string, opts?: { bold?: boolean; color?: string }) {
    const y = doc.y;
    const font = opts?.bold ? "Helvetica-Bold" : "Helvetica";
    const color = opts?.color ?? (opts?.bold ? COLORS.text1 : COLORS.text2);
    doc.font(font).fontSize(10).fillColor(color).text(desc, cardX + cardPad, y, { width: innerWidth * 0.5 });
    doc
      .font(font)
      .fontSize(10)
      .fillColor(color)
      .text(days, cardX + cardPad + innerWidth * 0.5, y, { width: innerWidth * 0.2, align: "right" });
    doc
      .font(font)
      .fontSize(10)
      .fillColor(color)
      .text(amount, cardX + cardPad, y, { width: innerWidth, align: "right" });
    doc.moveDown(0.9);
    doc
      .moveTo(cardX + cardPad, doc.y)
      .lineTo(cardX + contentWidth - cardPad, doc.y)
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .stroke();
    doc.moveDown(0.6);
  }

  sectionHeading("APPRENTICE DETAILS");
  detailRow("Apprentice Name", input.apprenticeName);
  detailRow("Apprentice ID", input.apprenticeId ?? "—");
  detailRow("Email ID", input.apprenticeEmail);
  detailRow("Hire Date", formatDatePart(input.hireDate));
  detailRow("Month", input.monthLabel);

  doc.moveDown(0.4);
  sectionHeading("SALARY CALCULATION");

  const headerY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text3)
    .text("DESCRIPTION", cardX + cardPad, headerY, { width: innerWidth * 0.5 });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text3)
    .text("DAYS", cardX + cardPad + innerWidth * 0.5, headerY, { width: innerWidth * 0.2, align: "right" });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text3)
    .text("AMOUNT (INR)", cardX + cardPad, headerY, { width: innerWidth, align: "right" });
  doc.moveDown(0.9);
  doc
    .moveTo(cardX + cardPad, doc.y)
    .lineTo(cardX + contentWidth - cardPad, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();
  doc.moveDown(0.6);

  const perDayRate = input.stipend / 30;
  salaryRow("Monthly Stipend", "—", formatCurrencyForPdf(input.stipend));
  salaryRow("Regular Leave Taken", String(input.regularLeave), "—");
  salaryRow("Loss of Pay (LOP) Deduction", String(input.lopDays), formatCurrencyForPdf(input.deduction));
  salaryRow("Per Day Rate (Stipend ÷ 30)", "", formatCurrencyForPdf(perDayRate));
  salaryRow("Final Payment", "", formatCurrencyForPdf(input.finalPayment), {
    bold: true,
    color: COLORS.success,
  });

  // ── Acknowledgement ───────────────────────────────────────────────
  doc.moveDown(0.4);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text2)
    .text("Acknowledged by:", cardX + cardPad, doc.y, { width: innerWidth });
  doc.moveDown(0.4);

  const signatureBuffer = decodeSignature(input.signatureDataUrl);
  const signatureY = doc.y;
  doc.image(signatureBuffer, cardX + cardPad, signatureY, { fit: [140, 50] });
  doc.y = signatureY + 56;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.text1)
    .text(input.apprenticeName, cardX + cardPad, doc.y, { width: innerWidth });
  doc.moveDown(0.2);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text3)
    .text(`Acknowledged on: ${formatDatePart(input.signedAt, true)}`, cardX + cardPad, doc.y, {
      width: innerWidth,
    });

  const cardBottom = doc.y + cardPad;

  // Card border, stroked on top of the content (outline only, doesn't
  // obscure any text) — drawn last so its exact height can be measured
  // from the content that just flowed through it.
  doc
    .roundedRect(cardX, cardTop, contentWidth, cardBottom - cardTop, 8)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  // ── Footer ────────────────────────────────────────────────────────
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.text3)
    .text(
      "This is a system-generated stipend slip. Apprentice Leave System.",
      marginX,
      cardBottom + 24,
      { width: contentWidth, align: "center" },
    );

  doc.end();
  return done;
}
