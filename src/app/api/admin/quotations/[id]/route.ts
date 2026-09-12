import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { QUOTATION_STATUSES } from "@/lib/crm-constants";

const updateSchema = z.object({
  status: z.enum(QUOTATION_STATUSES),
  discountUsd: z.number().nonnegative().optional().nullable(),
  discountUzs: z.number().nonnegative().optional().nullable(),
  taxPercent: z.number().min(0).max(100).optional().nullable(),
  validUntil: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: { tour: true, customer: true },
  });
  if (!quotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(quotation);
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

  const quotation = await prisma.quotation.update({
    where: { id: Number(id) },
    data: parsed.data,
    include: { tour: true, customer: true },
  });
  return NextResponse.json(quotation);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.quotation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
