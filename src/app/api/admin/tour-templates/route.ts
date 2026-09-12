import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { tourPayloadSchema } from "@/lib/tour-pricing";

export const dynamic = "force-dynamic";

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  payload: tourPayloadSchema.omit({ name: true }),
});

export async function GET() {
  const templates = await prisma.tourTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true, createdAt: true },
  });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const template = await prisma.tourTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      payload: parsed.data.payload,
    },
  });
  return NextResponse.json(template, { status: 201 });
}
