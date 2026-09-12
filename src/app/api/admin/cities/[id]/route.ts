import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const citySchema = z.object({
  name: z.string().min(1),
  nameRu: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  country: z.string().min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = citySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const city = await prisma.city.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(city);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.city.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
