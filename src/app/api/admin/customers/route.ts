import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPES, GENDERS } from "@/lib/crm-constants";

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

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { company: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      bookings: {
        where: { status: { not: "cancelled" } },
        select: { totalUsd: true, totalUzs: true, createdAt: true },
      },
    },
  });

  const withStats = customers.map(({ bookings, ...c }) => ({
    ...c,
    tripsCount: bookings.length,
    totalSpentUsd: bookings.reduce((sum, b) => sum + Number(b.totalUsd), 0),
    totalSpentUzs: bookings.reduce((sum, b) => sum + Number(b.totalUzs), 0),
    lastTripAt: bookings.length
      ? bookings.reduce((latest, b) => (b.createdAt > latest ? b.createdAt : latest), bookings[0].createdAt)
      : null,
  }));

  return NextResponse.json(withStats);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.create({ data: parsed.data });
  return NextResponse.json(customer, { status: 201 });
}
