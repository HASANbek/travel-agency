import { prisma } from "@/lib/prisma";

export async function syncInvoiceStatuses(bookingId: number) {
  const payments = await prisma.payment.findMany({
    where: { bookingId },
    select: { amountUsd: true, amountUzs: true },
  });
  const paidUsd = payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
  const paidUzs = payments.reduce((sum, p) => sum + Number(p.amountUzs ?? 0), 0);

  const invoices = await prisma.invoice.findMany({ where: { bookingId } });
  for (const invoice of invoices) {
    const amountUsd = Number(invoice.amountUsd);
    const amountUzs = Number(invoice.amountUzs);
    const isPaid = paidUsd >= amountUsd && paidUzs >= amountUzs;
    const isPartial = !isPaid && (paidUsd > 0 || paidUzs > 0);
    const status = isPaid ? "paid" : isPartial ? "partial" : "unpaid";
    if (status !== invoice.status) {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status } });
    }
  }
}
