import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const attractionSchema = z.object({
  cityId: z.number().int().positive(),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionRu: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  entranceFeeUsd: z.number().nonnegative().optional().nullable(),
  entranceFeeUzs: z.number().nonnegative().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const attractions = await prisma.attraction.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true },
  });
  return NextResponse.json(attractions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = attractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attraction = await prisma.attraction.create({ data: parsed.data });
  return NextResponse.json(attraction, { status: 201 });
}
