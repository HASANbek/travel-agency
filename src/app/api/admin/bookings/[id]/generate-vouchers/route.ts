import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: Number(id) },
    include: {
      tour: {
        include: {
          localTransports: { include: { localTransport: true } },
          guides: { include: { guide: true } },
          hotelRates: { include: { hotel: true, rate: { include: { room: true } } } },
          restaurants: { include: { restaurant: true } },
          excursions: { include: { excursion: true } },
        },
      },
      vouchers: true,
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingKeys = new Set(
    booking.vouchers.map((v) => `${v.serviceType}::${v.serviceName}::${v.day}`)
  );

  const candidates: {
    serviceType: string;
    serviceName: string;
    day: number;
    notes: string | null;
  }[] = [];

  for (const entry of booking.tour.localTransports) {
    if (entry.localTransport.type !== "transfer") continue;
    const parts: string[] = [];
    if (entry.localTransport.location) parts.push(entry.localTransport.location);
    if (entry.time) parts.push(`${entry.time}`);
    candidates.push({
      serviceType: "transfer",
      serviceName: entry.localTransport.name,
      day: entry.day,
      notes: parts.length > 0 ? parts.join(" · ") : null,
    });
  }
  for (const entry of booking.tour.guides) {
    candidates.push({
      serviceType: "guide",
      serviceName: entry.guide.name,
      day: entry.day,
      notes: entry.guide.phone ? `Tel: ${entry.guide.phone}` : null,
    });
  }
  for (const entry of booking.tour.hotelRates) {
    const parts = [entry.rate.room.roomType, entry.rate.mealPlan, `${entry.nights} kecha`];
    candidates.push({
      serviceType: "hotel",
      serviceName: entry.hotel.name,
      day: entry.day,
      notes: parts.join(" · "),
    });
  }
  for (const entry of booking.tour.restaurants) {
    const parts: string[] = [];
    if (entry.restaurant.cuisine) parts.push(entry.restaurant.cuisine);
    if (entry.restaurant.mealType) parts.push(entry.restaurant.mealType);
    candidates.push({
      serviceType: "restaurant",
      serviceName: entry.restaurant.name,
      day: entry.day,
      notes: parts.length > 0 ? parts.join(" · ") : null,
    });
  }
  for (const entry of booking.tour.excursions) {
    const parts: string[] = [];
    if (entry.excursion.category) parts.push(entry.excursion.category);
    if (entry.excursion.durationHours) parts.push(`${entry.excursion.durationHours}h`);
    candidates.push({
      serviceType: "excursion",
      serviceName: entry.excursion.name,
      day: entry.day,
      notes: parts.length > 0 ? parts.join(" · ") : null,
    });
  }

  const toCreate = candidates.filter(
    (c) => !existingKeys.has(`${c.serviceType}::${c.serviceName}::${c.day}`)
  );

  if (toCreate.length > 0) {
    await prisma.voucher.createMany({
      data: toCreate.map((c) => ({ ...c, bookingId: booking.id })),
    });
  }

  const vouchers = await prisma.voucher.findMany({
    where: { bookingId: booking.id },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(vouchers);
}
