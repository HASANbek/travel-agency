import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTourLineItems, tourInclude, TourPayload } from "@/lib/tour-pricing";

const TIERS = [
  { key: "economy", label: "Economy", markup: 0.15 },
  { key: "standard", label: "Standard", markup: 0.2 },
  { key: "premium", label: "Premium", markup: 0.25 },
] as const;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: Number(id) },
    include: { customer: true },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  const cityNames = (inquiry.cities || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (cityNames.length === 0) {
    return NextResponse.json(
      { error: "Inquiry has no cities to build packages from" },
      { status: 400 }
    );
  }

  const cities = await prisma.city.findMany({
    where: { OR: cityNames.map((name) => ({ name: { equals: name } })) },
  });
  if (cities.length === 0) {
    return NextResponse.json(
      { error: "None of the inquiry's cities match the catalog" },
      { status: 400 }
    );
  }
  const cityIds = cities.map((c) => c.id);

  const [attractions, transports, guides, hotelRates, restaurants, excursions] =
    await Promise.all([
      prisma.attraction.findMany({ where: { cityId: { in: cityIds } }, orderBy: { entranceFeeUsd: "asc" } }),
      prisma.localTransport.findMany({ where: { cityId: { in: cityIds }, type: "local" } }),
      prisma.guide.findMany({ where: { cityId: { in: cityIds } }, orderBy: { priceUsd: "asc" } }),
      prisma.hotelRate.findMany({
        where: { hotel: { cityId: { in: cityIds } } },
        include: { hotel: true, room: true },
        orderBy: { hotel: { stars: "asc" } },
      }),
      prisma.restaurant.findMany({ where: { cityId: { in: cityIds } }, orderBy: { pricePerPersonUsd: "asc" } }),
      prisma.excursion.findMany({ where: { cityId: { in: cityIds } }, orderBy: { sellUsd: "asc" } }),
    ]);

  function byCity<T extends { cityId?: number }>(list: T[], cityId: number) {
    return list.filter((x) => x.cityId === cityId);
  }
  function hotelsInCity(cityId: number) {
    return hotelRates.filter((r) => r.hotel.cityId === cityId);
  }

  const tiers = TIERS.map((tier) => {
    const payload: Omit<TourPayload, "name"> = {
      notes: null,
      profitUsd: 0,
      profitUzs: 0,
      cityIds,
      attractions: [],
      localTransports: [],
      guides: [],
      trainTickets: [],
      flightTickets: [],
      hotelRates: [],
      restaurants: [],
      excursions: [],
    };

    cityIds.forEach((cityId, idx) => {
      const day = idx + 1;

      const cityAttractions = byCity(attractions, cityId);
      const attractionCount =
        tier.key === "economy"
          ? Math.min(2, cityAttractions.length)
          : tier.key === "standard"
            ? Math.min(4, cityAttractions.length)
            : cityAttractions.length;
      cityAttractions.slice(0, attractionCount).forEach((a) => {
        payload.attractions.push({ attractionId: a.id, quantity: 1, day });
      });

      const cityTransports = byCity(transports, cityId);
      if (cityTransports.length > 0) {
        payload.localTransports.push({
          localTransportId: cityTransports[0].id,
          quantity: 1,
          day,
          time: null,
        });
      }

      const cityGuides = byCity(guides, cityId);
      if (tier.key !== "economy" && cityGuides.length > 0) {
        payload.guides.push({ guideId: cityGuides[0].id, quantity: 1, day });
      }

      const cityHotels = hotelsInCity(cityId);
      if (cityHotels.length > 0) {
        const rateIdx =
          tier.key === "economy" ? 0 : tier.key === "standard" ? Math.floor(cityHotels.length / 2) : cityHotels.length - 1;
        payload.hotelRates.push({
          hotelRateId: cityHotels[rateIdx].id,
          quantity: 1,
          nights: 1,
          day,
        });
      }

      const cityRestaurants = byCity(restaurants, cityId);
      const restaurantCount = tier.key === "economy" ? 0 : tier.key === "standard" ? 1 : Math.min(2, cityRestaurants.length);
      cityRestaurants.slice(0, restaurantCount).forEach((r) => {
        payload.restaurants.push({
          restaurantId: r.id,
          quantity: Math.max(1, inquiry.adults + inquiry.children),
          day,
        });
      });

      const cityExcursions = byCity(excursions, cityId);
      const excursionCount = tier.key === "economy" ? 0 : tier.key === "standard" ? 1 : Math.min(2, cityExcursions.length);
      cityExcursions.slice(0, excursionCount).forEach((e) => {
        payload.excursions.push({ excursionId: e.id, quantity: 1, day });
      });
    });

    return { tier, payload };
  });

  const createdTours = [];
  for (const { tier, payload } of tiers) {
    const fullPayload: TourPayload = { name: "", ...payload };
    const {
      attractionsData,
      transportsData,
      guidesData,
      trainData,
      flightData,
      hotelRatesData,
      restaurantsData,
      excursionsData,
      componentUsd,
      componentUzs,
    } = await computeTourLineItems(fullPayload);

    const profitUsd = Math.round(componentUsd * tier.markup * 100) / 100;
    const profitUzs = Math.round(componentUzs * tier.markup * 100) / 100;
    const totalUsd = componentUsd + profitUsd;
    const totalUzs = componentUzs + profitUzs;

    const customerName = [inquiry.customer.firstName, inquiry.customer.lastName]
      .filter(Boolean)
      .join(" ");

    const tour = await prisma.tour.create({
      data: {
        name: `${customerName} — ${tier.label}`,
        customerId: inquiry.customerId,
        inquiryId: inquiry.id,
        profitUsd,
        profitUzs,
        totalUsd,
        totalUzs,
        cities: { create: cityIds.map((cityId, position) => ({ cityId, position })) },
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

    createdTours.push({ tier: tier.key, label: tier.label, tour });
  }

  return NextResponse.json(createdTours, { status: 201 });
}
