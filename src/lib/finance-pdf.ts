import { jsPDF } from "jspdf";
import { formatUsd, formatUzs } from "@/lib/format";
import { AdminLang, getPdfDict } from "@/lib/admin-i18n";
import { PT_SANS_BOLD_BASE64, PT_SANS_REGULAR_BASE64 } from "@/lib/pt-sans-font";

const INDIGO: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [23, 23, 23];
const MUTED: [number, number, number] = [110, 110, 110];
const LIGHT_LINE: [number, number, number] = [225, 225, 232];
const FONT = "PTSans";

function newDoc() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("PTSans-Regular.ttf", PT_SANS_REGULAR_BASE64);
  doc.addFont("PTSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("PTSans-Bold.ttf", PT_SANS_BOLD_BASE64);
  doc.addFont("PTSans-Bold.ttf", FONT, "bold");
  return doc;
}

function drawBanner(doc: jsPDF, brand: string, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerHeight = 92;
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageWidth, bannerHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(FONT, "normal");
  doc.text(brand, 48, 30);
  doc.setFontSize(22);
  doc.setFont(FONT, "bold");
  doc.text(title, 48, 60);
  return bannerHeight;
}

export type VoucherItem = {
  serviceTypeLabel: string;
  serviceName: string | null;
  day: number | null;
};

export type VoucherPdfData = {
  bookingId: number;
  tourName: string;
  customerName: string | null;
  vouchers: VoucherItem[];
};

export function generateVouchersPdf(data: VoucherPdfData, lang: AdminLang = "uz") {
  const pdf = getPdfDict(lang);
  const doc = newDoc();
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawBanner(doc, pdf.brand, pdf.voucherTitle) + 30;

  doc.setFontSize(11);
  doc.setFont(FONT, "bold");
  doc.setTextColor(...INK);
  doc.text(`${pdf.voucherFor}: ${data.tourName}`, marginX, y);
  y += 18;

  doc.setFontSize(10);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  if (data.customerName) {
    doc.text(data.customerName, marginX, y);
    y += 16;
  }
  doc.text(`${pdf.voucherBookingRef}: #${data.bookingId}`, marginX, y);
  y += 26;

  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  const sorted = data.vouchers
    .slice()
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

  for (const v of sorted) {
    doc.setFillColor(...INDIGO);
    doc.circle(marginX + 10, y - 4, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(FONT, "bold");
    doc.text(v.day ? String(v.day) : "-", marginX + 10, y - 1, { align: "center" });

    doc.setTextColor(...INK);
    doc.setFontSize(11.5);
    doc.setFont(FONT, "bold");
    doc.text(v.serviceTypeLabel, marginX + 28, y);

    doc.setFontSize(10.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    doc.text(v.serviceName || "-", marginX + 28, y + 15);
    y += 40;
  }

  if (sorted.length === 0) {
    doc.setFontSize(10.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    doc.text("-", marginX, y);
  }

  const safeName = `${data.tourName}-vouchers`.replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`${safeName}.pdf`);
}

export type ServiceVoucherPdfData = {
  bookingId: number;
  tourName: string;
  customerName: string | null;
  serviceTypeLabel: string;
  serviceName: string | null;
  notes: string | null;
  date: string;
  quantity: number;
};

export function generateServiceVoucherPdf(data: ServiceVoucherPdfData, lang: AdminLang = "uz") {
  const pdf = getPdfDict(lang);
  const doc = newDoc();
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  let y = drawBanner(doc, pdf.brand, `${pdf.voucherTitle} — ${data.serviceTypeLabel}`) + 40;

  function row(label: string, value: string, bold = false) {
    doc.setFontSize(10);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    doc.text(label, marginX, y);
    doc.setFontSize(bold ? 14 : 11.5);
    doc.setFont(FONT, bold ? "bold" : "normal");
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value, contentWidth - 170);
    doc.text(lines, marginX + 170, y);
    y += Math.max(24, lines.length * 15 + 8);
  }

  row(pdf.voucherBookingRef, `#${data.bookingId}`);
  row(pdf.voucherFor, data.customerName || "-");
  row(pdf.voucherTour, data.tourName);
  row(pdf.voucherDate, data.date);

  y += 8;
  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 30;

  row(pdf.voucherService, data.serviceName || "-", true);
  if (data.notes) {
    row(pdf.voucherDetails, data.notes);
  }
  if (data.quantity > 1) {
    row(pdf.voucherQuantity, String(data.quantity));
  }

  y += 40;
  doc.setDrawColor(...LIGHT_LINE);
  doc.line(marginX, y, marginX + 200, y);
  y += 14;
  doc.setFontSize(9.5);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  doc.text(pdf.voucherSignature, marginX, y);

  y += 40;
  doc.setFontSize(10);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  doc.text(pdf.voucherThanks, marginX, y);

  const safeName = `${data.serviceTypeLabel}-${data.serviceName ?? "voucher"}`
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();
  doc.save(`${safeName}.pdf`);
}

export type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: string | null;
  dueDate: string | null;
  statusLabel: string;
  amountUsd: string | number;
  amountUzs: string | number;
  discountUsd?: string | number | null;
  discountUzs?: string | number | null;
  taxPercent?: string | number | null;
  tourName: string;
  customerName: string | null;
};

export function generateInvoicePdf(data: InvoicePdfData, lang: AdminLang = "uz") {
  const pdf = getPdfDict(lang);
  const doc = newDoc();
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawBanner(doc, pdf.brand, pdf.invoiceTitle) + 30;

  doc.setFontSize(10.5);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  doc.text(`# ${data.invoiceNumber}`, marginX, y);
  doc.text(`${pdf.invoiceStatus}: ${data.statusLabel}`, pageWidth - marginX, y, { align: "right" });
  y += 18;
  if (data.issuedAt) {
    doc.text(`${pdf.invoiceIssued}: ${data.issuedAt}`, marginX, y);
  }
  if (data.dueDate) {
    doc.text(`${pdf.invoiceDue}: ${data.dueDate}`, pageWidth - marginX, y, { align: "right" });
  }
  y += 30;

  doc.setFontSize(11);
  doc.setFont(FONT, "bold");
  doc.setTextColor(...INK);
  doc.text(`${pdf.invoiceBillTo}: ${data.customerName || "-"}`, marginX, y);
  y += 18;
  doc.setFontSize(10.5);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  doc.text(data.tourName, marginX, y);
  y += 30;

  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(1);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 30;

  const discountUsd = Number(data.discountUsd || 0);
  const discountUzs = Number(data.discountUzs || 0);
  const taxPercent = Number(data.taxPercent || 0);
  const baseUsd = Number(data.amountUsd);
  const baseUzs = Number(data.amountUzs);
  const afterDiscountUsd = baseUsd - discountUsd;
  const afterDiscountUzs = baseUzs - discountUzs;
  const taxUsd = (afterDiscountUsd * taxPercent) / 100;
  const taxUzs = (afterDiscountUzs * taxPercent) / 100;
  const totalUsd = afterDiscountUsd + taxUsd;
  const totalUzs = afterDiscountUzs + taxUzs;

  function row(label: string, value: string, bold = false) {
    doc.setFontSize(bold ? 13 : 10.5);
    doc.setFont(FONT, bold ? "bold" : "normal");
    doc.setTextColor(...(bold ? INK : MUTED));
    doc.text(label, marginX, y);
    doc.text(value, pageWidth - marginX, y, { align: "right" });
    y += bold ? 22 : 18;
  }

  row(pdf.invoiceAmount, `${formatUsd(baseUsd)}  /  ${formatUzs(baseUzs)}`);
  if (discountUsd > 0 || discountUzs > 0) {
    row(pdf.invoiceDiscount, `-${formatUsd(discountUsd)}  /  -${formatUzs(discountUzs)}`);
  }
  if (taxPercent > 0) {
    row(`${pdf.invoiceTax} (${taxPercent}%)`, `${formatUsd(taxUsd)}  /  ${formatUzs(taxUzs)}`);
  }
  y += 6;
  doc.setDrawColor(...LIGHT_LINE);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;
  row(pdf.invoiceTotalDue, `${formatUsd(totalUsd)}  /  ${formatUzs(totalUzs)}`, true);

  const safeName = data.invoiceNumber.replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`${safeName}.pdf`);
}
