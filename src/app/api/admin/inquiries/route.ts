import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const inquirySchema = z.object({
  customerId: z.number().int().positive(),
  source: z.string().optional().nullable(),
  requestDate: z.string().optional().nullable(),
  travelStartDate: z.string().optional().nullable(),
  travelEndDate: z.string().optional().nullable(),
  days: z.number().int().nonnegative().optional().nullable(),
  adults: z.number().int().nonnegative().default(1),
  children: z.number().int().nonnegative().default(0),
  childrenAges: z.string().optional().nullable(),
  countries: z.string().optional().nullable(),
  cities: z.string().optional().nullable(),
  destinations: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  currency: z.string().default("USD"),
  hotelCategory: z.string().optional().nullable(),
  roomRequirement: z.string().optional().nullable(),
  mealPlan: z.string().optional().nullable(),
  transportRequirement: z.string().optional().nullable(),
  guideRequirement: z.boolean().default(false),
  guideLanguage: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  followUpStep: z.number().int().nonnegative().default(0),
  excursionRequirement: z.boolean().default(false),
  specialRequests: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(PRIORITIES).default("medium"),
  status: z.enum(INQUIRY_STATUSES).default("new"),
  responsibleManager: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const customerId = request.nextUrl.searchParams.get("customerId");
  const inquiries = await prisma.inquiry.findMany({
    where: {
      status: status || undefined,
      customerId: customerId ? Number(customerId) : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  return NextResponse.json(inquiries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.create({
    data: parsed.data,
    include: { customer: true },
  });
  return NextResponse.json(inquiry, { status: 201 });
}
