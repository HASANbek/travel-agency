import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const citySchema = z.object({
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  country: z.string().min(1).optional(),
});

export async function GET() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { attractions: true, localTransports: true },
      },
    },
  });
  return NextResponse.json(cities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = citySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const city = await prisma.city.create({ data: parsed.data });
  return NextResponse.json(city, { status: 201 });
}
