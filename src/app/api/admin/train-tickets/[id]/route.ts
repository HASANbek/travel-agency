import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const trainSchema = z.object({
  fromCityId: z.number().int().positive(),
  toCityId: z.number().int().positive(),
  trainName: z.string().optional().nullable(),
  priceUsd: z.number().nonnegative().optional().nullable(),
  priceUzs: z.number().nonnegative().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = trainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ticket = await prisma.trainTicket.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(ticket);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.trainTicket.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
