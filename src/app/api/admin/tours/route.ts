import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import {
  computeTourLineItems,
  tourInclude,
  tourPayloadSchema,
} from "@/lib/tour-pricing";

export async function GET() {
  const tours = await prisma.tour.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      cities: { include: { city: true }, orderBy: { position: "asc" } },
    },
  });
  return NextResponse.json(tours);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = tourPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const {
    attractionsData,
    transportsData,
    guidesData,
    trainData,
    flightData,
    hotelRatesData,
    restaurantsData,
    excursionsData,
    totalUsd,
    totalUzs,
  } = await computeTourLineItems(payload);

  const tour = await prisma.tour.create({
    data: {
      name: payload.name,
      notes: payload.notes || null,
      profitUsd: payload.profitUsd,
      profitUzs: payload.profitUzs,
      totalUsd,
      totalUzs,
      cities: {
        create: payload.cityIds.map((cityId, position) => ({ cityId, position })),
      },
      attractions: { create: attractionsData },
      localTransports: { create: transportsData },
      guides: { create: guidesData },
      trainTickets: { create: trainData },
      flightTickets: { create: flightData },
      hotelRates: { create: hotelRatesData },
      restaurants: { create: restaurantsData },
      excursions: { create: excursionsData },
    },
    include: tourInclude,
  });

  return NextResponse.json(tour, { status: 201 });
}
