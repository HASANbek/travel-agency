import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const guideSchema = z.object({
  cityId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  descriptionRu: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  priceUsd: z.number().nonnegative().optional().nullable(),
  priceUzs: z.number().nonnegative().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const guides = await prisma.guide.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true },
  });
  return NextResponse.json(guides);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const guide = await prisma.guide.create({ data: parsed.data });
  return NextResponse.json(guide, { status: 201 });
}
