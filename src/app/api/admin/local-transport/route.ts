import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const transportSchema = z.object({
  cityId: z.number().int().positive(),
  type: z.enum(["local", "transfer"]).default("local"),
  location: z.enum(["airport", "station", "border"]).optional().nullable(),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionRu: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  priceUsd: z.number().nonnegative().optional().nullable(),
  priceUzs: z.number().nonnegative().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const transports = await prisma.localTransport.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true },
  });
  return NextResponse.json(transports);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = transportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const transport = await prisma.localTransport.create({ data: parsed.data });
  return NextResponse.json(transport, { status: 201 });
}
