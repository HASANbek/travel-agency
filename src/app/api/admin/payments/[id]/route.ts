import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncInvoiceStatuses } from "@/lib/invoice-sync";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: Number(id) },
    include: {
      booking: {
        include: {
          tour: true,
          customer: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(payment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payment = await prisma.payment.delete({ where: { id: Number(id) } });
  await syncInvoiceStatuses(payment.bookingId);
  return NextResponse.json({ success: true });
}
