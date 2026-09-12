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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const guide = await prisma.guide.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(guide);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.guide.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
