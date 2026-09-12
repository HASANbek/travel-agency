import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id: Number(id) },
    include: {
      city: true,
      rooms: true,
      rates: { include: { room: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(hotel);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = hotelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const hotel = await prisma.hotel.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(hotel);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.hotel.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
