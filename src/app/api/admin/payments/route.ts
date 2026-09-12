import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PAYMENT_TYPES } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const paymentSchema = z.object({
  bookingId: z.number().int().positive(),
  type: z.enum(PAYMENT_TYPES).default("cash"),
  amountUsd: z.number().nonnegative().optional().nullable(),
  amountUzs: z.number().nonnegative().optional().nullable(),
  exchangeRate: z.number().positive().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payment = await prisma.payment.create({ data: parsed.data });
  return NextResponse.json(payment, { status: 201 });
}
