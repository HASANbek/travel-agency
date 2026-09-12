import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const excursionSchema = z.object({
  cityId: z.number().int().positive(),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionRu: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  durationHours: z.number().nonnegative().optional().nullable(),
  minGroup: z.number().int().positive().optional().nullable(),
  maxGroup: z.number().int().positive().optional().nullable(),
  guideRequired: z.boolean().default(false),
  transportRequired: z.boolean().default(false),
  netUsd: z.number().nonnegative().optional().nullable(),
  netUzs: z.number().nonnegative().optional().nullable(),
  sellUsd: z.number().nonnegative().optional().nullable(),
  sellUzs: z.number().nonnegative().optional().nullable(),
  season: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const excursions = await prisma.excursion.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true },
  });
  return NextResponse.json(excursions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = excursionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const excursion = await prisma.excursion.create({ data: parsed.data });
  return NextResponse.json(excursion, { status: 201 });
}
