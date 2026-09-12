import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const hotelSchema = z.object({
  cityId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  stars: z.number().int().min(1).max(5).default(3),
  description: z.string().optional().nullable(),
  descriptionRu: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const hotels = await prisma.hotel.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true, rooms: true, rates: true },
  });
  return NextResponse.json(hotels);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = hotelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const hotel = await prisma.hotel.create({ data: parsed.data });
  return NextResponse.json(hotel, { status: 201 });
}
