import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUSES } from "@/lib/crm-constants";

const updateSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  startDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function withPaid<T extends { payments: { amountUsd: unknown; amountUzs: unknown }[] }>(
  booking: T
) {
  const paidUsd = booking.payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
  const paidUzs = booking.payments.reduce((sum, p) => sum + Number(p.amountUzs ?? 0), 0);
  return { ...booking, paidUsd, paidUzs };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: Number(id) },
    include: {
      tour: true,
      customer: true,
      quotation: true,
      payments: { orderBy: { createdAt: "desc" } },
      vouchers: { orderBy: [{ day: "asc" }, { createdAt: "asc" }] },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(withPaid(booking));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id: Number(id) },
    data: parsed.data,
    include: { tour: true, customer: true, quotation: true, payments: true },
  });
  return NextResponse.json(withPaid(booking));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.booking.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
