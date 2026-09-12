import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SUPPLIER_TYPES } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const supplierSchema = z.object({
  name: z.string().min(1),
  type: z.enum(SUPPLIER_TYPES).default("other"),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  currency: z.string().default("USD"),
  bankInfo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supplier = await prisma.supplier.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(supplier);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.supplier.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
