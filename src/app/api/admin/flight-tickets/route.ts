import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const flightSchema = z.object({
  fromCityId: z.number().int().positive(),
  toCityId: z.number().int().positive(),
  airline: z.string().optional().nullable(),
  priceUsd: z.number().nonnegative().optional().nullable(),
  priceUzs: z.number().nonnegative().optional().nullable(),
});

export async function GET() {
  const tickets = await prisma.flightTicket.findMany({
    orderBy: { id: "desc" },
    include: { fromCity: true, toCity: true },
  });
  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = flightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ticket = await prisma.flightTicket.create({ data: parsed.data });
  return NextResponse.json(ticket, { status: 201 });
}
