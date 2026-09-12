import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPES, GENDERS } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  customerType: z.enum(CUSTOMER_TYPES).default("individual"),
  vipStatus: z.boolean().default(false),
  preferences: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  responsibleManager: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: {
      inquiries: { orderBy: { createdAt: "desc" } },
      tours: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(customer);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
