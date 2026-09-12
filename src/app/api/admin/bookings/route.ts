import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  tourId: z.number().int().positive(),
  quotationId: z.number().int().positive().optional().nullable(),
});

function withPaid<T extends { payments: { amountUsd: unknown; amountUzs: unknown }[] }>(
  booking: T
) {
  const paidUsd = booking.payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
  const paidUzs = booking.payments.reduce((sum, p) => sum + Number(p.amountUzs ?? 0), 0);
  return { ...booking, paidUsd, paidUzs };
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const bookings = await prisma.booking.findMany({
    where: { status: status || undefined },
    orderBy: { createdAt: "desc" },
    include: {
      tour: true,
      customer: true,
      quotation: true,
      payments: { select: { amountUsd: true, amountUzs: true } },
    },
  });
  return NextResponse.json(bookings.map(withPaid));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tour = await prisma.tour.findUnique({ where: { id: parsed.data.tourId } });
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const quotation = parsed.data.quotationId
    ? await prisma.quotation.findUnique({ where: { id: parsed.data.quotationId } })
    : null;

  const totalUsd = Number(tour.totalUsd) - Number(quotation?.discountUsd ?? 0);
  const totalUzs = Number(tour.totalUzs) - Number(quotation?.discountUzs ?? 0);

  const booking = await prisma.booking.create({
    data: {
      tourId: tour.id,
      quotationId: quotation?.id ?? null,
      customerId: tour.customerId ?? quotation?.customerId ?? null,
      totalUsd,
      totalUzs,
    },
    include: { tour: true, customer: true, quotation: true, payments: true },
  });

  if (quotation) {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: "accepted" },
    });
  }

  return NextResponse.json(withPaid(booking), { status: 201 });
}
