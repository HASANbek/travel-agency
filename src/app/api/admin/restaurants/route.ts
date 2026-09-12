import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const restaurantSchema = z.object({
  cityId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cuisine: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  mealType: z.string().optional().nullable(),
  pricePerPersonUsd: z.number().nonnegative().optional().nullable(),
  pricePerPersonUzs: z.number().nonnegative().optional().nullable(),
  groupPriceUsd: z.number().nonnegative().optional().nullable(),
  groupPriceUzs: z.number().nonnegative().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cityId = request.nextUrl.searchParams.get("cityId");
  const restaurants = await prisma.restaurant.findMany({
    where: cityId ? { cityId: Number(cityId) } : undefined,
    orderBy: { name: "asc" },
    include: { city: true },
  });
  return NextResponse.json(restaurants);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = restaurantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const restaurant = await prisma.restaurant.create({ data: parsed.data });
  return NextResponse.json(restaurant, { status: 201 });
}
