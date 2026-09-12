import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = transportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const transport = await prisma.localTransport.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(transport);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.localTransport.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
