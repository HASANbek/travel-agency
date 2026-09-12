import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SUPPLIER_TYPES } from "@/lib/crm-constants";

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

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const suppliers = await prisma.supplier.findMany({
    where: { type: type || undefined },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supplier = await prisma.supplier.create({ data: parsed.data });
  return NextResponse.json(supplier, { status: 201 });
}
