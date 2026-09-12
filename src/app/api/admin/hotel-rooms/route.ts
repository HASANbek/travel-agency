import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roomSchema = z.object({
  hotelId: z.number().int().positive(),
  roomType: z.string().min(1),
  bedType: z.string().optional().nullable(),
  adultCapacity: z.number().int().positive().default(2),
  childCapacity: z.number().int().nonnegative().default(0),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const room = await prisma.hotelRoom.create({ data: parsed.data });
  return NextResponse.json(room, { status: 201 });
}
