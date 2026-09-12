import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = restaurantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const restaurant = await prisma.restaurant.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(restaurant);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.restaurant.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
