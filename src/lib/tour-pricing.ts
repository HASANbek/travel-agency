import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const tourPayloadSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional().nullable(),
  profitUsd: z.number().nonnegative().default(0),
  profitUzs: z.number().nonnegative().default(0),
  cityIds: z.array(z.number().int().positive()).min(1),
  attractions: z.array(
    z.object({
      attractionId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ),
  localTransports: z.array(
    z.object({
      localTransportId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
      time: z.string().optional().nullable(),
    })
  ),
  guides: z.array(
    z.object({
      guideId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ),
  trainTickets: z.array(
    z.object({
      trainTicketId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ),
  flightTickets: z.array(
    z.object({
      flightTicketId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ),
  hotelRates: z.array(
    z.object({
      hotelRateId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      nights: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ).default([]),
  restaurants: z.array(
    z.object({
      restaurantId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ).default([]),
  excursions: z.array(
    z.object({
      excursionId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      day: z.number().int().positive(),
    })
  ).default([]),
});

export type TourPayload = z.infer<typeof tourPayloadSchema>;

export async function computeTourLineItems(payload: TourPayload) {
  const [
    attractionRecords,
    transportRecords,
    guideRecords,
    trainRecords,
    flightRecords,
    hotelRateRecords,
    restaurantRecords,
    excursionRecords,
  ] = await Promise.all([
      prisma.attraction.findMany({
        where: { id: { in: payload.attractions.map((a) => a.attractionId) } },
      }),
      prisma.localTransport.findMany({
        where: {
          id: { in: payload.localTransports.map((t) => t.localTransportId) },
        },
      }),
      prisma.guide.findMany({
        where: { id: { in: payload.guides.map((g) => g.guideId) } },
      }),
      prisma.trainTicket.findMany({
        where: { id: { in: payload.trainTickets.map((t) => t.trainTicketId) } },
      }),
      prisma.flightTicket.findMany({
        where: {
          id: { in: payload.flightTickets.map((t) => t.flightTicketId) },
        },
      }),
      prisma.hotelRate.findMany({
        where: { id: { in: payload.hotelRates.map((h) => h.hotelRateId) } },
      }),
      prisma.restaurant.findMany({
        where: { id: { in: payload.restaurants.map((r) => r.restaurantId) } },
      }),
      prisma.excursion.findMany({
        where: { id: { in: payload.excursions.map((e) => e.excursionId) } },
      }),
    ]);

  const attractionMap = new Map(attractionRecords.map((r) => [r.id, r]));
  const transportMap = new Map(transportRecords.map((r) => [r.id, r]));
  const guideMap = new Map(guideRecords.map((r) => [r.id, r]));
  const trainMap = new Map(trainRecords.map((r) => [r.id, r]));
  const flightMap = new Map(flightRecords.map((r) => [r.id, r]));
  const hotelRateMap = new Map(hotelRateRecords.map((r) => [r.id, r]));
  const restaurantMap = new Map(restaurantRecords.map((r) => [r.id, r]));
  const excursionMap = new Map(excursionRecords.map((r) => [r.id, r]));

  let totalUsd = 0;
  let totalUzs = 0;

  const attractionsData = payload.attractions.map((item) => {
    const record = attractionMap.get(item.attractionId);
    const unitUsd = record?.entranceFeeUsd ? Number(record.entranceFeeUsd) : 0;
    const unitUzs = record?.entranceFeeUzs ? Number(record.entranceFeeUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      attractionId: item.attractionId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.entranceFeeUsd ?? null,
      unitPriceUzs: record?.entranceFeeUzs ?? null,
    };
  });

  const transportsData = payload.localTransports.map((item) => {
    const record = transportMap.get(item.localTransportId);
    const unitUsd = record?.priceUsd ? Number(record.priceUsd) : 0;
    const unitUzs = record?.priceUzs ? Number(record.priceUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      localTransportId: item.localTransportId,
      quantity: item.quantity,
      day: item.day,
      time: item.time || null,
      unitPriceUsd: record?.priceUsd ?? null,
      unitPriceUzs: record?.priceUzs ?? null,
    };
  });

  const guidesData = payload.guides.map((item) => {
    const record = guideMap.get(item.guideId);
    const unitUsd = record?.priceUsd ? Number(record.priceUsd) : 0;
    const unitUzs = record?.priceUzs ? Number(record.priceUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      guideId: item.guideId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.priceUsd ?? null,
      unitPriceUzs: record?.priceUzs ?? null,
    };
  });

  const trainData = payload.trainTickets.map((item) => {
    const record = trainMap.get(item.trainTicketId);
    const unitUsd = record?.priceUsd ? Number(record.priceUsd) : 0;
    const unitUzs = record?.priceUzs ? Number(record.priceUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      trainTicketId: item.trainTicketId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.priceUsd ?? null,
      unitPriceUzs: record?.priceUzs ?? null,
    };
  });

  const flightData = payload.flightTickets.map((item) => {
    const record = flightMap.get(item.flightTicketId);
    const unitUsd = record?.priceUsd ? Number(record.priceUsd) : 0;
    const unitUzs = record?.priceUzs ? Number(record.priceUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      flightTicketId: item.flightTicketId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.priceUsd ?? null,
      unitPriceUzs: record?.priceUzs ?? null,
    };
  });

  const hotelRatesData = payload.hotelRates.map((item) => {
    const record = hotelRateMap.get(item.hotelRateId);
    const unitUsd = record?.sellUsd ? Number(record.sellUsd) : 0;
    const unitUzs = record?.sellUzs ? Number(record.sellUzs) : 0;
    totalUsd += unitUsd * item.quantity * item.nights;
    totalUzs += unitUzs * item.quantity * item.nights;
    return {
      hotelRateId: item.hotelRateId,
      hotelId: record?.hotelId ?? 0,
      quantity: item.quantity,
      nights: item.nights,
      day: item.day,
      unitPriceUsd: record?.sellUsd ?? null,
      unitPriceUzs: record?.sellUzs ?? null,
    };
  });

  const restaurantsData = payload.restaurants.map((item) => {
    const record = restaurantMap.get(item.restaurantId);
    const unitUsd = record?.pricePerPersonUsd ? Number(record.pricePerPersonUsd) : 0;
    const unitUzs = record?.pricePerPersonUzs ? Number(record.pricePerPersonUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      restaurantId: item.restaurantId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.pricePerPersonUsd ?? null,
      unitPriceUzs: record?.pricePerPersonUzs ?? null,
    };
  });

  const excursionsData = payload.excursions.map((item) => {
    const record = excursionMap.get(item.excursionId);
    const unitUsd = record?.sellUsd ? Number(record.sellUsd) : 0;
    const unitUzs = record?.sellUzs ? Number(record.sellUzs) : 0;
    totalUsd += unitUsd * item.quantity;
    totalUzs += unitUzs * item.quantity;
    return {
      excursionId: item.excursionId,
      quantity: item.quantity,
      day: item.day,
      unitPriceUsd: record?.sellUsd ?? null,
      unitPriceUzs: record?.sellUzs ?? null,
    };
  });

  return {
    attractionsData,
    transportsData,
    guidesData,
    trainData,
    flightData,
    hotelRatesData,
    restaurantsData,
    excursionsData,
    componentUsd: totalUsd,
    componentUzs: totalUzs,
    totalUsd: totalUsd + payload.profitUsd,
    totalUzs: totalUzs + payload.profitUzs,
  };
}

export const tourInclude = {
  cities: { include: { city: true }, orderBy: { position: "asc" as const } },
  attractions: { include: { attraction: { include: { city: true } } } },
  localTransports: { include: { localTransport: { include: { city: true } } } },
  guides: { include: { guide: { include: { city: true } } } },
  trainTickets: { include: { trainTicket: { include: { fromCity: true, toCity: true } } } },
  flightTickets: { include: { flightTicket: { include: { fromCity: true, toCity: true } } } },
  hotelRates: { include: { rate: { include: { room: true } }, hotel: { include: { city: true } } } },
  restaurants: { include: { restaurant: { include: { city: true } } } },
  excursions: { include: { excursion: { include: { city: true } } } },
};
