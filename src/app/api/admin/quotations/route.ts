import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  tourId: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const tourId = request.nextUrl.searchParams.get("tourId");
  const quotations = await prisma.quotation.findMany({
    where: {
      status: status || undefined,
      tourId: tourId ? Number(tourId) : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { tour: true, customer: true },
  });
  return NextResponse.json(quotations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tour = await prisma.tour.findUnique({ where: { id: parsed.data.tourId } });
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const existingDraft = await prisma.quotation.findFirst({
    where: { tourId: tour.id, status: "draft" },
    orderBy: { createdAt: "desc" },
    include: { tour: true, customer: true },
  });
  if (existingDraft) {
    return NextResponse.json(existingDraft);
  }

  const lastQuotation = await prisma.quotation.findFirst({
    where: { tourId: tour.id },
    orderBy: { version: "desc" },
  });

  const quotation = await prisma.quotation.create({
    data: {
      tourId: tour.id,
      customerId: tour.customerId,
      version: (lastQuotation?.version ?? 0) + 1,
      status: "draft",
    },
    include: { tour: true, customer: true },
  });
  return NextResponse.json(quotation, { status: 201 });
}
