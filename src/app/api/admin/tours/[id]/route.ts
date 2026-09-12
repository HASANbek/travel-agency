import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import {
  computeTourLineItems,
  tourInclude,
  tourPayloadSchema,
} from "@/lib/tour-pricing";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({
    where: { id: Number(id) },
    include: tourInclude,
  });
  if (!tour) {
    return NextResponse.json({ error: "Tur topilmadi" }, { status: 404 });
  }
  return NextResponse.json(tour);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tourId = Number(id);
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

  const [, , , , , , , , , tour] = await prisma.$transaction([
    prisma.tourCity.deleteMany({ where: { tourId } }),
    prisma.tourAttraction.deleteMany({ where: { tourId } }),
    prisma.tourLocalTransport.deleteMany({ where: { tourId } }),
    prisma.tourGuide.deleteMany({ where: { tourId } }),
    prisma.tourTrainTicket.deleteMany({ where: { tourId } }),
    prisma.tourFlightTicket.deleteMany({ where: { tourId } }),
    prisma.tourHotelRate.deleteMany({ where: { tourId } }),
    prisma.tourRestaurant.deleteMany({ where: { tourId } }),
    prisma.tourExcursion.deleteMany({ where: { tourId } }),
    prisma.tour.update({
      where: { id: tourId },
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
    }),
  ]);

  return NextResponse.json(tour);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.tour.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
