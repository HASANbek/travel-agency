import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { VOUCHER_SERVICE_TYPES } from "@/lib/crm-constants";

const voucherSchema = z.object({
  bookingId: z.number().int().positive(),
  serviceType: z.enum(VOUCHER_SERVICE_TYPES),
  serviceName: z.string().optional().nullable(),
  day: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = voucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const voucher = await prisma.voucher.create({ data: parsed.data });
  return NextResponse.json(voucher, { status: 201 });
}
