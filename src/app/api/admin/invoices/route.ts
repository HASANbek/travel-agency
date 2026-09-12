import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  bookingId: z.number().int().positive(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      bookingId: booking.id,
      invoiceNumber,
      amountUsd: booking.totalUsd,
      amountUzs: booking.totalUzs,
      issuedAt: new Date().toISOString().slice(0, 10),
      dueDate: parsed.data.dueDate || null,
      notes: parsed.data.notes || null,
    },
  });
  return NextResponse.json(invoice, { status: 201 });
}
