import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = attractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attraction = await prisma.attraction.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(attraction);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.attraction.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
