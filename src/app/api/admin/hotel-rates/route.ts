import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MEAL_PLANS } from "@/lib/crm-constants";

const rateSchema = z.object({
  hotelId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  season: z.string().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  mealPlan: z.enum(MEAL_PLANS).default("BB"),
  netUsd: z.number().nonnegative().optional().nullable(),
  netUzs: z.number().nonnegative().optional().nullable(),
  sellUsd: z.number().nonnegative().optional().nullable(),
  sellUzs: z.number().nonnegative().optional().nullable(),
  commissionPercent: z.number().min(0).max(100).optional().nullable(),
  singleSupplementUsd: z.number().nonnegative().optional().nullable(),
  childPriceUsd: z.number().nonnegative().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const rates = await prisma.hotelRate.findMany({
    where: cityId ? { hotel: { cityId: Number(cityId) } } : undefined,
    include: { hotel: true, room: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rate = await prisma.hotelRate.create({
    data: parsed.data,
    include: { hotel: true, room: true },
  });
  return NextResponse.json(rate, { status: 201 });
}
