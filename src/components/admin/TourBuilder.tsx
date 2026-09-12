"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/admin/ui";
import { formatUsd, formatUzs } from "@/lib/format";
import { useAdminI18n } from "@/lib/admin-i18n";
import { localizedName } from "@/lib/localize";

type City = { id: number; name: string; nameRu: string | null; nameEn: string | null; country: string };
type Attraction = {
  id: number;
  cityId: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  entranceFeeUsd: string | null;
  entranceFeeUzs: string | null;
};
type Transport = {
  id: number;
  cityId: number;
  type: string;
  location: string | null;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  priceUsd: string | null;
  priceUzs: string | null;
};
type Guide = {
  id: number;
  cityId: number;
  name: string;
  priceUsd: string | null;
  priceUzs: string | null;
};
type TrainTicket = {
  id: number;
  fromCityId: number;
  toCityId: number;
  trainName: string | null;
  priceUsd: string | null;
  priceUzs: string | null;
  fromCity: City;
  toCity: City;
};
type FlightTicket = {
  id: number;
  fromCityId: number;
  toCityId: number;
  airline: string | null;
  priceUsd: string | null;
  priceUzs: string | null;
  fromCity: City;
  toCity: City;
};
type Restaurant = {
  id: number;
  cityId: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  pricePerPersonUsd: string | null;
  pricePerPersonUzs: string | null;
};
type Excursion = {
  id: number;
  cityId: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  sellUsd: string | null;
  sellUzs: string | null;
};
type HotelRateOffer = {
  id: number;
  mealPlan: string;
  sellUsd: string | null;
  sellUzs: string | null;
  hotel: { id: number; cityId: number; name: string };
  room: { id: number; roomType: string };
};

type Selection = Record<number, { quantity: number; day: number }>;

// Transport is a shared catalog usable in any city, and the same type can be used
// independently in several cities — so entries are a list, not a keyed-by-id map.
type TransportEntry = {
  instanceId: string;
  cityId: number;
  localTransportId: number;
  quantity: number;
  day: number;
  time: string;
};

// Guides work the same way as transport: a shared catalog usable in any city.
type GuideEntry = {
  instanceId: string;
  cityId: number;
  guideId: number;
  quantity: number;
  day: number;
};

type RestaurantEntry = {
  instanceId: string;
  cityId: number;
  restaurantId: number;
  quantity: number;
  day: number;
};

type ExcursionEntry = {
  instanceId: string;
  cityId: number;
  excursionId: number;
  quantity: number;
  day: number;
};

type HotelEntry = {
  instanceId: string;
  cityId: number;
  hotelRateId: number;
  quantity: number;
  nights: number;
  day: number;
};

type CustomerOption = { id: number; firstName: string; lastName: string | null };

type TourDetail = {
  id: number;
  name: string;
  notes: string | null;
  customerId: number | null;
  profitUsd: string | null;
  profitUzs: string | null;
  cities: { cityId: number }[];
  attractions: { attractionId: number; quantity: number; day: number }[];
  localTransports: {
    localTransportId: number;
    quantity: number;
    day: number;
    time: string | null;
  }[];
  guides: { guideId: number; quantity: number; day: number }[];
  trainTickets: { trainTicketId: number; quantity: number; day: number }[];
  flightTickets: { flightTicketId: number; quantity: number; day: number }[];
  hotelRates: { hotelRateId: number; quantity: number; nights: number; day: number }[];
  restaurants: { restaurantId: number; quantity: number; day: number }[];
  excursions: { excursionId: number; quantity: number; day: number }[];
};

export default function TourBuilder({ tourId }: { tourId?: number }) {
  const router = useRouter();
  const { t, lang } = useAdminI18n();
  const isEdit = Boolean(tourId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerId, setCustomerId] = useState<string>("");

  const [cities, setCities] = useState<City[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [trainTickets, setTrainTickets] = useState<TrainTicket[]>([]);
  const [flightTickets, setFlightTickets] = useState<FlightTicket[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [hotelRateOffers, setHotelRateOffers] = useState<HotelRateOffer[]>([]);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [profitUsd, setProfitUsd] = useState("0");
  const [profitUzs, setProfitUzs] = useState("0");
  const [cityOrder, setCityOrder] = useState<number[]>([]);
  const [draggedCityId, setDraggedCityId] = useState<number | null>(null);

  const [attractionSel, setAttractionSel] = useState<Selection>({});
  const [transportEntries, setTransportEntries] = useState<TransportEntry[]>([]);
  const [transportPick, setTransportPick] = useState<Record<number, string>>({});
  const [transferPick, setTransferPick] = useState<Record<number, string>>({});
  const [guideEntries, setGuideEntries] = useState<GuideEntry[]>([]);
  const [guidePick, setGuidePick] = useState<Record<number, string>>({});
  const [restaurantEntries, setRestaurantEntries] = useState<RestaurantEntry[]>([]);
  const [restaurantPick, setRestaurantPick] = useState<Record<number, string>>({});
  const [excursionEntries, setExcursionEntries] = useState<ExcursionEntry[]>([]);
  const [excursionPick, setExcursionPick] = useState<Record<number, string>>({});
  const [hotelEntries, setHotelEntries] = useState<HotelEntry[]>([]);
  const [hotelPick, setHotelPick] = useState<Record<number, string>>({});
  const [trainSel, setTrainSel] = useState<Selection>({});
  const [flightSel, setFlightSel] = useState<Selection>({});

  const nextInstanceId = useRef(0);
  function newInstanceId() {
    nextInstanceId.current += 1;
    return `t${nextInstanceId.current}`;
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [
        citiesRes,
        attractionsRes,
        transportsRes,
        guidesRes,
        trainRes,
        flightRes,
        restaurantsRes,
        excursionsRes,
        hotelRatesRes,
        templatesRes,
        customersRes,
      ] = await Promise.all([
          fetch("/api/admin/cities"),
          fetch("/api/admin/attractions"),
          fetch("/api/admin/local-transport"),
          fetch("/api/admin/guides"),
          fetch("/api/admin/train-tickets"),
          fetch("/api/admin/flight-tickets"),
          fetch("/api/admin/restaurants"),
          fetch("/api/admin/excursions"),
          fetch("/api/admin/hotel-rates"),
          fetch("/api/admin/tour-templates"),
          fetch("/api/admin/customers"),
        ]);
      setCities(await citiesRes.json());
      setCustomers(await customersRes.json());
      setAttractions(await attractionsRes.json());
      const transportsList: Transport[] = await transportsRes.json();
      setTransports(transportsList);
      const guidesList: Guide[] = await guidesRes.json();
      setGuides(guidesList);
      setTrainTickets(await trainRes.json());
      setFlightTickets(await flightRes.json());
      const restaurantsList: Restaurant[] = await restaurantsRes.json();
      setRestaurants(restaurantsList);
      const excursionsList: Excursion[] = await excursionsRes.json();
      setExcursions(excursionsList);
      const hotelRatesList: HotelRateOffer[] = await hotelRatesRes.json();
      setHotelRateOffers(hotelRatesList);
      setTemplates(await templatesRes.json());

      if (tourId) {
        const tourRes = await fetch(`/api/admin/tours/${tourId}`);
        const tour: TourDetail = await tourRes.json();
        setName(tour.name);
        setNotes(tour.notes ?? "");
        setCustomerId(tour.customerId ? String(tour.customerId) : "");
        setProfitUsd(tour.profitUsd ?? "0");
        setProfitUzs(tour.profitUzs ?? "0");
        setCityOrder(tour.cities.map((c) => c.cityId));
        setAttractionSel(
          Object.fromEntries(
            tour.attractions.map((a) => [a.attractionId, { quantity: a.quantity, day: a.day }])
          )
        );
        setTransportEntries(
          tour.localTransports.map((tp) => {
            nextInstanceId.current += 1;
            const catalog = transportsList.find((x) => x.id === tp.localTransportId);
            return {
              instanceId: `t${nextInstanceId.current}`,
              cityId: catalog?.cityId ?? 0,
              localTransportId: tp.localTransportId,
              quantity: tp.quantity,
              day: tp.day,
              time: tp.time ?? "",
            };
          })
        );
        setGuideEntries(
          tour.guides.map((g) => {
            nextInstanceId.current += 1;
            const catalog = guidesList.find((x) => x.id === g.guideId);
            return {
              instanceId: `g${nextInstanceId.current}`,
              cityId: catalog?.cityId ?? 0,
              guideId: g.guideId,
              quantity: g.quantity,
              day: g.day,
            };
          })
        );
        setTrainSel(
          Object.fromEntries(
            tour.trainTickets.map((tk) => [tk.trainTicketId, { quantity: tk.quantity, day: tk.day }])
          )
        );
        setFlightSel(
          Object.fromEntries(
            tour.flightTickets.map((tk) => [
              tk.flightTicketId,
              { quantity: tk.quantity, day: tk.day },
            ])
          )
        );
        setRestaurantEntries(
          (tour.restaurants ?? []).map((r) => {
            nextInstanceId.current += 1;
            const catalog = restaurantsList.find((x) => x.id === r.restaurantId);
            return {
              instanceId: `r${nextInstanceId.current}`,
              cityId: catalog?.cityId ?? 0,
              restaurantId: r.restaurantId,
              quantity: r.quantity,
              day: r.day,
            };
          })
        );
        setExcursionEntries(
          (tour.excursions ?? []).map((ex) => {
            nextInstanceId.current += 1;
            const catalog = excursionsList.find((x) => x.id === ex.excursionId);
            return {
              instanceId: `ex${nextInstanceId.current}`,
              cityId: catalog?.cityId ?? 0,
              excursionId: ex.excursionId,
              quantity: ex.quantity,
              day: ex.day,
            };
          })
        );
        setHotelEntries(
          (tour.hotelRates ?? []).map((h) => {
            nextInstanceId.current += 1;
            const catalog = hotelRatesList.find((x) => x.id === h.hotelRateId);
            return {
              instanceId: `h${nextInstanceId.current}`,
              cityId: catalog?.hotel.cityId ?? 0,
              hotelRateId: h.hotelRateId,
              quantity: h.quantity,
              nights: h.nights,
              day: h.day,
            };
          })
        );
      }
      setLoading(false);
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  const cityMap = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities]);

  // A city belongs to the tour as soon as something from it (or a ticket touching it) is selected.
  const selectedCityIds = useMemo(() => {
    const set = new Set<number>();
    for (const id of Object.keys(attractionSel)) {
      const a = attractions.find((x) => x.id === Number(id));
      if (a) set.add(a.cityId);
    }
    for (const entry of transportEntries) {
      set.add(entry.cityId);
    }
    for (const entry of guideEntries) {
      set.add(entry.cityId);
    }
    for (const entry of restaurantEntries) {
      set.add(entry.cityId);
    }
    for (const entry of excursionEntries) {
      set.add(entry.cityId);
    }
    for (const entry of hotelEntries) {
      set.add(entry.cityId);
    }
    for (const id of Object.keys(trainSel)) {
      const tk = trainTickets.find((x) => x.id === Number(id));
      if (tk) {
        set.add(tk.fromCityId);
        set.add(tk.toCityId);
      }
    }
    for (const id of Object.keys(flightSel)) {
      const tk = flightTickets.find((x) => x.id === Number(id));
      if (tk) {
        set.add(tk.fromCityId);
        set.add(tk.toCityId);
      }
    }
    return set;
  }, [
    attractionSel,
    transportEntries,
    guideEntries,
    restaurantEntries,
    excursionEntries,
    hotelEntries,
    trainSel,
    flightSel,
    attractions,
    trainTickets,
    flightTickets,
  ]);

  // Keep a stable, reorderable display order that tracks which cities are currently selected.
  useEffect(() => {
    setCityOrder((prev) => {
      const kept = prev.filter((id) => selectedCityIds.has(id));
      const added = Array.from(selectedCityIds).filter((id) => !kept.includes(id));
      const next = [...kept, ...added];
      const same = next.length === prev.length && next.every((id, i) => id === prev[i]);
      return same ? prev : next;
    });
  }, [selectedCityIds]);

  function moveCity(cityId: number, dir: -1 | 1) {
    setCityOrder((prev) => {
      const idx = prev.indexOf(cityId);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  function reorderCity(draggedId: number, targetId: number) {
    if (draggedId === targetId) return;
    setCityOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedId);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedId);
      return next;
    });
  }

  function transferLocationLabel(location: string | null) {
    if (location === "airport") return t.transport.locationAirport;
    if (location === "station") return t.transport.locationStation;
    if (location === "border") return t.transport.locationBorder;
    return "";
  }

  // Default day guess: where this city sits (or would land) in the route.
  function defaultDayForCity(cityId: number) {
    const idx = cityOrder.indexOf(cityId);
    return idx >= 0 ? idx + 1 : cityOrder.length + 1;
  }

  function addTransportEntry(cityId: number) {
    const picked = transportPick[cityId];
    if (!picked) return;
    setTransportEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        localTransportId: Number(picked),
        quantity: 1,
        day: defaultDayForCity(cityId),
        time: "",
      },
    ]);
    setTransportPick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function addTransferEntry(cityId: number) {
    const picked = transferPick[cityId];
    if (!picked) return;
    setTransportEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        localTransportId: Number(picked),
        quantity: 1,
        day: defaultDayForCity(cityId),
        time: "",
      },
    ]);
    setTransferPick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function removeTransportEntry(instanceId: string) {
    setTransportEntries((prev) => prev.filter((e) => e.instanceId !== instanceId));
  }

  function updateTransportEntry(
    instanceId: string,
    patch: Partial<Pick<TransportEntry, "quantity" | "day" | "time">>
  ) {
    setTransportEntries((prev) =>
      prev.map((e) => (e.instanceId === instanceId ? { ...e, ...patch } : e))
    );
  }

  function addGuideEntry(cityId: number) {
    const picked = guidePick[cityId];
    if (!picked) return;
    setGuideEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        guideId: Number(picked),
        quantity: 1,
        day: defaultDayForCity(cityId),
      },
    ]);
    setGuidePick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function removeGuideEntry(instanceId: string) {
    setGuideEntries((prev) => prev.filter((e) => e.instanceId !== instanceId));
  }

  function updateGuideEntry(
    instanceId: string,
    patch: Partial<Pick<GuideEntry, "quantity" | "day">>
  ) {
    setGuideEntries((prev) =>
      prev.map((e) => (e.instanceId === instanceId ? { ...e, ...patch } : e))
    );
  }

  function addRestaurantEntry(cityId: number) {
    const picked = restaurantPick[cityId];
    if (!picked) return;
    setRestaurantEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        restaurantId: Number(picked),
        quantity: 1,
        day: defaultDayForCity(cityId),
      },
    ]);
    setRestaurantPick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function removeRestaurantEntry(instanceId: string) {
    setRestaurantEntries((prev) => prev.filter((e) => e.instanceId !== instanceId));
  }

  function updateRestaurantEntry(
    instanceId: string,
    patch: Partial<Pick<RestaurantEntry, "quantity" | "day">>
  ) {
    setRestaurantEntries((prev) =>
      prev.map((e) => (e.instanceId === instanceId ? { ...e, ...patch } : e))
    );
  }

  function addExcursionEntry(cityId: number) {
    const picked = excursionPick[cityId];
    if (!picked) return;
    setExcursionEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        excursionId: Number(picked),
        quantity: 1,
        day: defaultDayForCity(cityId),
      },
    ]);
    setExcursionPick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function removeExcursionEntry(instanceId: string) {
    setExcursionEntries((prev) => prev.filter((e) => e.instanceId !== instanceId));
  }

  function updateExcursionEntry(
    instanceId: string,
    patch: Partial<Pick<ExcursionEntry, "quantity" | "day">>
  ) {
    setExcursionEntries((prev) =>
      prev.map((e) => (e.instanceId === instanceId ? { ...e, ...patch } : e))
    );
  }

  function addHotelEntry(cityId: number) {
    const picked = hotelPick[cityId];
    if (!picked) return;
    setHotelEntries((prev) => [
      ...prev,
      {
        instanceId: newInstanceId(),
        cityId,
        hotelRateId: Number(picked),
        quantity: 1,
        nights: 1,
        day: defaultDayForCity(cityId),
      },
    ]);
    setHotelPick((prev) => ({ ...prev, [cityId]: "" }));
  }

  function removeHotelEntry(instanceId: string) {
    setHotelEntries((prev) => prev.filter((e) => e.instanceId !== instanceId));
  }

  function updateHotelEntry(
    instanceId: string,
    patch: Partial<Pick<HotelEntry, "quantity" | "nights" | "day">>
  ) {
    setHotelEntries((prev) =>
      prev.map((e) => (e.instanceId === instanceId ? { ...e, ...patch } : e))
    );
  }

  function toggle(
    sel: Selection,
    setSel: (s: Selection) => void,
    id: number,
    defaultQty: number,
    defaultDay: number
  ) {
    if (id in sel) {
      const rest = { ...sel };
      delete rest[id];
      setSel(rest);
    } else {
      setSel({ ...sel, [id]: { quantity: defaultQty, day: defaultDay } });
    }
  }

  function setQuantity(sel: Selection, setSel: (s: Selection) => void, id: number, value: number) {
    setSel({ ...sel, [id]: { ...sel[id], quantity: Math.max(1, value) } });
  }

  function setDay(sel: Selection, setSel: (s: Selection) => void, id: number, value: number) {
    setSel({ ...sel, [id]: { ...sel[id], day: Math.max(1, value) } });
  }

  // Day picker always offers one day beyond the highest currently in use, so there's
  // always a way to push something onto a fresh day without typing a number.
  const dayOptions = useMemo(() => {
    let max = cityOrder.length;
    for (const sel of [attractionSel, trainSel, flightSel]) {
      for (const v of Object.values(sel)) {
        if (v.day > max) max = v.day;
      }
    }
    for (const entry of transportEntries) {
      if (entry.day > max) max = entry.day;
    }
    for (const entry of guideEntries) {
      if (entry.day > max) max = entry.day;
    }
    for (const entry of restaurantEntries) {
      if (entry.day > max) max = entry.day;
    }
    for (const entry of excursionEntries) {
      if (entry.day > max) max = entry.day;
    }
    for (const entry of hotelEntries) {
      if (entry.day > max) max = entry.day;
    }
    return Array.from({ length: Math.max(max, 1) + 1 }, (_, i) => i + 1);
  }, [
    cityOrder,
    attractionSel,
    transportEntries,
    guideEntries,
    restaurantEntries,
    excursionEntries,
    hotelEntries,
    trainSel,
    flightSel,
  ]);

  const componentTotal = useMemo(() => {
    let usd = 0;
    let uzs = 0;
    for (const [id, { quantity }] of Object.entries(attractionSel)) {
      const a = attractions.find((x) => x.id === Number(id));
      usd += (a?.entranceFeeUsd ? Number(a.entranceFeeUsd) : 0) * quantity;
      uzs += (a?.entranceFeeUzs ? Number(a.entranceFeeUzs) : 0) * quantity;
    }
    for (const entry of transportEntries) {
      const tp = transports.find((x) => x.id === entry.localTransportId);
      usd += (tp?.priceUsd ? Number(tp.priceUsd) : 0) * entry.quantity;
      uzs += (tp?.priceUzs ? Number(tp.priceUzs) : 0) * entry.quantity;
    }
    for (const entry of guideEntries) {
      const g = guides.find((x) => x.id === entry.guideId);
      usd += (g?.priceUsd ? Number(g.priceUsd) : 0) * entry.quantity;
      uzs += (g?.priceUzs ? Number(g.priceUzs) : 0) * entry.quantity;
    }
    for (const [id, { quantity }] of Object.entries(trainSel)) {
      const tk = trainTickets.find((x) => x.id === Number(id));
      usd += (tk?.priceUsd ? Number(tk.priceUsd) : 0) * quantity;
      uzs += (tk?.priceUzs ? Number(tk.priceUzs) : 0) * quantity;
    }
    for (const [id, { quantity }] of Object.entries(flightSel)) {
      const tk = flightTickets.find((x) => x.id === Number(id));
      usd += (tk?.priceUsd ? Number(tk.priceUsd) : 0) * quantity;
      uzs += (tk?.priceUzs ? Number(tk.priceUzs) : 0) * quantity;
    }
    for (const entry of restaurantEntries) {
      const r = restaurants.find((x) => x.id === entry.restaurantId);
      usd += (r?.pricePerPersonUsd ? Number(r.pricePerPersonUsd) : 0) * entry.quantity;
      uzs += (r?.pricePerPersonUzs ? Number(r.pricePerPersonUzs) : 0) * entry.quantity;
    }
    for (const entry of excursionEntries) {
      const ex = excursions.find((x) => x.id === entry.excursionId);
      usd += (ex?.sellUsd ? Number(ex.sellUsd) : 0) * entry.quantity;
      uzs += (ex?.sellUzs ? Number(ex.sellUzs) : 0) * entry.quantity;
    }
    for (const entry of hotelEntries) {
      const h = hotelRateOffers.find((x) => x.id === entry.hotelRateId);
      usd += (h?.sellUsd ? Number(h.sellUsd) : 0) * entry.quantity * entry.nights;
      uzs += (h?.sellUzs ? Number(h.sellUzs) : 0) * entry.quantity * entry.nights;
    }
    return { usd, uzs };
  }, [
    attractionSel,
    transportEntries,
    guideEntries,
    restaurantEntries,
    excursionEntries,
    hotelEntries,
    trainSel,
    flightSel,
    attractions,
    transports,
    guides,
    restaurants,
    excursions,
    hotelRateOffers,
    trainTickets,
    flightTickets,
  ]);

  const grandTotal = useMemo(
    () => ({
      usd: componentTotal.usd + (Number(profitUsd) || 0),
      uzs: componentTotal.uzs + (Number(profitUzs) || 0),
    }),
    [componentTotal, profitUsd, profitUzs]
  );

  function buildPayload() {
    return {
      name,
      notes: notes || null,
      customerId: customerId ? Number(customerId) : null,
      profitUsd: Number(profitUsd) || 0,
      profitUzs: Number(profitUzs) || 0,
      cityIds: cityOrder,
      attractions: Object.entries(attractionSel).map(([id, { quantity, day }]) => ({
        attractionId: Number(id),
        quantity,
        day,
      })),
      localTransports: transportEntries.map((e) => ({
        localTransportId: e.localTransportId,
        quantity: e.quantity,
        day: e.day,
        time: e.time || null,
      })),
      guides: guideEntries.map((e) => ({
        guideId: e.guideId,
        quantity: e.quantity,
        day: e.day,
      })),
      trainTickets: Object.entries(trainSel).map(([id, { quantity, day }]) => ({
        trainTicketId: Number(id),
        quantity,
        day,
      })),
      flightTickets: Object.entries(flightSel).map(([id, { quantity, day }]) => ({
        flightTicketId: Number(id),
        quantity,
        day,
      })),
      hotelRates: hotelEntries.map((e) => ({
        hotelRateId: e.hotelRateId,
        quantity: e.quantity,
        nights: e.nights,
        day: e.day,
      })),
      restaurants: restaurantEntries.map((e) => ({
        restaurantId: e.restaurantId,
        quantity: e.quantity,
        day: e.day,
      })),
      excursions: excursionEntries.map((e) => ({
        excursionId: e.excursionId,
        quantity: e.quantity,
        day: e.day,
      })),
    };
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) {
      setError(t.builder.errorName);
      return;
    }
    if (cityOrder.length === 0) {
      setError(t.builder.errorSelection);
      return;
    }

    const payload = buildPayload();

    setSaving(true);
    const res = await fetch(isEdit ? `/api/admin/tours/${tourId}` : "/api/admin/tours", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      setError(t.builder.errorSave);
      return;
    }
    router.push("/admin/tours");
  }

  async function handleSaveAsTemplate() {
    if (cityOrder.length === 0) {
      setError(t.builder.errorSelection);
      return;
    }
    const templateName = window.prompt(t.builder.templateNamePrompt, name || "");
    if (!templateName) return;
    const fullPayload = buildPayload();
    const payload = { ...fullPayload } as Partial<typeof fullPayload>;
    delete payload.name;
    delete payload.notes;
    delete payload.customerId;
    delete payload.profitUsd;
    delete payload.profitUzs;
    setSavingTemplate(true);
    await fetch("/api/admin/tour-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName,
        payload: { ...payload, profitUsd: 0, profitUzs: 0 },
      }),
    });
    setSavingTemplate(false);
    setTemplateSavedMsg(true);
    setTimeout(() => setTemplateSavedMsg(false), 2500);
  }

  async function handleLoadTemplate(templateId: string) {
    if (!templateId) return;
    const res = await fetch(`/api/admin/tour-templates/${templateId}`);
    if (!res.ok) return;
    const template = await res.json();
    const payload = template.payload as {
      cityIds: number[];
      attractions: { attractionId: number; quantity: number; day: number }[];
      localTransports: { localTransportId: number; quantity: number; day: number; time: string | null }[];
      guides: { guideId: number; quantity: number; day: number }[];
      trainTickets: { trainTicketId: number; quantity: number; day: number }[];
      flightTickets: { flightTicketId: number; quantity: number; day: number }[];
      hotelRates: { hotelRateId: number; quantity: number; nights: number; day: number }[];
      restaurants: { restaurantId: number; quantity: number; day: number }[];
      excursions: { excursionId: number; quantity: number; day: number }[];
    };

    setCityOrder(payload.cityIds);
    setAttractionSel(
      Object.fromEntries(payload.attractions.map((a) => [a.attractionId, { quantity: a.quantity, day: a.day }]))
    );
    setTransportEntries(
      payload.localTransports.map((tp) => {
        const catalog = transports.find((x) => x.id === tp.localTransportId);
        return {
          instanceId: newInstanceId(),
          cityId: catalog?.cityId ?? 0,
          localTransportId: tp.localTransportId,
          quantity: tp.quantity,
          day: tp.day,
          time: tp.time ?? "",
        };
      })
    );
    setGuideEntries(
      payload.guides.map((g) => {
        const catalog = guides.find((x) => x.id === g.guideId);
        return {
          instanceId: newInstanceId(),
          cityId: catalog?.cityId ?? 0,
          guideId: g.guideId,
          quantity: g.quantity,
          day: g.day,
        };
      })
    );
    setRestaurantEntries(
      payload.restaurants.map((r) => {
        const catalog = restaurants.find((x) => x.id === r.restaurantId);
        return {
          instanceId: newInstanceId(),
          cityId: catalog?.cityId ?? 0,
          restaurantId: r.restaurantId,
          quantity: r.quantity,
          day: r.day,
        };
      })
    );
    setExcursionEntries(
      payload.excursions.map((ex) => {
        const catalog = excursions.find((x) => x.id === ex.excursionId);
        return {
          instanceId: newInstanceId(),
          cityId: catalog?.cityId ?? 0,
          excursionId: ex.excursionId,
          quantity: ex.quantity,
          day: ex.day,
        };
      })
    );
    setHotelEntries(
      payload.hotelRates.map((h) => {
        const catalog = hotelRateOffers.find((x) => x.id === h.hotelRateId);
        return {
          instanceId: newInstanceId(),
          cityId: catalog?.hotel.cityId ?? 0,
          hotelRateId: h.hotelRateId,
          quantity: h.quantity,
          nights: h.nights,
          day: h.day,
        };
      })
    );
    setTrainSel(
      Object.fromEntries(payload.trainTickets.map((tk) => [tk.trainTicketId, { quantity: tk.quantity, day: tk.day }]))
    );
    setFlightSel(
      Object.fromEntries(payload.flightTickets.map((tk) => [tk.flightTicketId, { quantity: tk.quantity, day: tk.day }]))
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-400">{t.common.loading}</p>;
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t.builder.titleEdit : t.builder.titleNew}
        description={t.builder.description}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Field label={t.builder.loadTemplate} className="w-64">
          <Select value="" onChange={(e) => handleLoadTemplate(e.target.value)}>
            <option value="">{t.builder.selectTemplate}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveAsTemplate}
          disabled={savingTemplate}
          className="mb-[1px]"
        >
          {savingTemplate ? t.builder.saving : t.builder.saveAsTemplate}
        </Button>
        {templateSavedMsg && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            {t.builder.templateSaved}
          </span>
        )}
      </div>

      <Card className="p-5 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <Field label={t.builder.tourName} className="w-64">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.builder.tourNamePlaceholder}
            />
          </Field>
          <Field label={t.builder.customer} className="w-56">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">{t.builder.customerNone}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName ?? ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.builder.notes} className="flex-1 min-w-[200px]">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.builder.notesPlaceholder}
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50 mb-1">
            {t.builder.routeLabel}
          </p>
          {cityOrder.length === 0 ? (
            <p className="text-sm text-gray-400">{t.builder.routeEmpty}</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2">{t.builder.routeHint}</p>
              <ol className="flex flex-wrap gap-2">
                {cityOrder.map((id, idx) => (
                  <li
                    key={id}
                    draggable
                    onDragStart={() => setDraggedCityId(id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedCityId !== null) reorderCity(draggedCityId, id);
                      setDraggedCityId(null);
                    }}
                    onDragEnd={() => setDraggedCityId(null)}
                    className={`flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 pl-2 pr-1.5 py-1 text-sm text-indigo-700 dark:text-indigo-300 cursor-move transition ${
                      draggedCityId === id
                        ? "opacity-40"
                        : draggedCityId !== null
                          ? "ring-2 ring-indigo-300 dark:ring-indigo-500/40"
                          : ""
                    }`}
                  >
                    <span className="text-indigo-300 dark:text-indigo-500/60" aria-hidden>
                      ⠿
                    </span>
                    <span className="font-medium">
                      {idx + 1}. {cityMap.get(id) ? localizedName(cityMap.get(id)!, lang) : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveCity(id, -1)}
                      disabled={idx === 0}
                      className="disabled:opacity-30"
                      title={t.builder.moveUp}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCity(id, 1)}
                      disabled={idx === cityOrder.length - 1}
                      className="disabled:opacity-30"
                      title={t.builder.moveDown}
                    >
                      ↓
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </Card>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t.builder.componentsHeading}
          </p>
          <p className="text-xs text-gray-400">{t.builder.dayHint}</p>
        </div>
        {cities.map((city) => {
          const cityAttractions = attractions.filter((a) => a.cityId === city.id);

          return (
            <Card key={city.id} className="p-5">
              <h3 className="text-sm font-semibold mb-3">📍 {localizedName(city, lang)}</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.attractionsHeading}
                  </p>
                  {cityAttractions.length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.attractionsEmpty}</p>
                  ) : (
                    <ul className="space-y-2">
                      {cityAttractions.map((a) => (
                        <li key={a.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={a.id in attractionSel}
                            onChange={() =>
                              toggle(
                                attractionSel,
                                setAttractionSel,
                                a.id,
                                1,
                                defaultDayForCity(a.cityId)
                              )
                            }
                            className="h-4 w-4 rounded accent-indigo-600"
                          />
                          <span className="flex-1 text-sm">{localizedName(a, lang)}</span>
                          <span className="text-xs text-gray-400 tabular-nums">
                            {formatUsd(a.entranceFeeUsd)}
                          </span>
                          {a.id in attractionSel && (
                            <>
                              <Input
                                type="number"
                                min={1}
                                title={t.builder.quantity}
                                value={attractionSel[a.id].quantity}
                                onChange={(e) =>
                                  setQuantity(
                                    attractionSel,
                                    setAttractionSel,
                                    a.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-14 py-1"
                              />
                              <Select
                                title={t.builder.day}
                                value={attractionSel[a.id].day}
                                onChange={(e) =>
                                  setDay(
                                    attractionSel,
                                    setAttractionSel,
                                    a.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 py-1"
                              >
                                {dayOptions.map((d) => (
                                  <option key={d} value={d}>
                                    {d}-{t.builder.dayOption}
                                  </option>
                                ))}
                              </Select>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.transportHeading}
                  </p>
                  {transports.filter((tp) => tp.type !== "transfer").length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.transportEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={transportPick[city.id] ?? ""}
                          onChange={(e) =>
                            setTransportPick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.transportSelect}</option>
                          {transports
                            .filter((tp) => tp.type !== "transfer")
                            .map((tp) => (
                              <option key={tp.id} value={tp.id}>
                                {localizedName(tp, lang)} — {formatUsd(tp.priceUsd)}
                              </option>
                            ))}
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addTransportEntry(city.id)}
                        >
                          {t.common.add}
                        </Button>
                      </div>

                      {transportEntries.filter(
                        (e) =>
                          e.cityId === city.id &&
                          transports.find((x) => x.id === e.localTransportId)?.type !== "transfer"
                      ).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.transportNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {transportEntries
                            .filter(
                              (e) =>
                                e.cityId === city.id &&
                                transports.find((x) => x.id === e.localTransportId)?.type !==
                                  "transfer"
                            )
                            .map((entry) => {
                              const tp = transports.find((x) => x.id === entry.localTransportId);
                              return (
                                <li key={entry.instanceId} className="flex items-center gap-2">
                                  <span className="flex-1 text-sm">
                                    {tp ? localizedName(tp, lang) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(tp?.priceUsd)}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.quantity}
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateTransportEntry(entry.instanceId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-14 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateTransportEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeTransportEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}

                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 mt-4">
                    {t.builder.transferHeading}
                  </p>
                  {transports.filter((tp) => tp.type === "transfer").length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.transferEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={transferPick[city.id] ?? ""}
                          onChange={(e) =>
                            setTransferPick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.transferSelect}</option>
                          {transports
                            .filter((tp) => tp.type === "transfer")
                            .map((tp) => (
                              <option key={tp.id} value={tp.id}>
                                {tp.location ? `[${transferLocationLabel(tp.location)}] ` : ""}
                                {localizedName(tp, lang)} — {formatUsd(tp.priceUsd)}
                              </option>
                            ))}
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addTransferEntry(city.id)}
                        >
                          {t.common.add}
                        </Button>
                      </div>

                      {transportEntries.filter(
                        (e) =>
                          e.cityId === city.id &&
                          transports.find((x) => x.id === e.localTransportId)?.type === "transfer"
                      ).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.transferNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {transportEntries
                            .filter(
                              (e) =>
                                e.cityId === city.id &&
                                transports.find((x) => x.id === e.localTransportId)?.type ===
                                  "transfer"
                            )
                            .map((entry) => {
                              const tp = transports.find((x) => x.id === entry.localTransportId);
                              return (
                                <li key={entry.instanceId} className="flex flex-wrap items-center gap-2">
                                  <span className="flex-1 text-sm">
                                    {tp?.location && (
                                      <span className="text-indigo-500 dark:text-indigo-300">
                                        [{transferLocationLabel(tp.location)}]{" "}
                                      </span>
                                    )}
                                    {tp ? localizedName(tp, lang) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(tp?.priceUsd)}
                                  </span>
                                  <Input
                                    type="time"
                                    title={t.builder.time}
                                    value={entry.time}
                                    onChange={(e) =>
                                      updateTransportEntry(entry.instanceId, {
                                        time: e.target.value,
                                      })
                                    }
                                    className="w-28 py-1"
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.quantity}
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateTransportEntry(entry.instanceId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-14 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateTransportEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeTransportEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.guidesHeading}
                  </p>
                  {guides.length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.guidesEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={guidePick[city.id] ?? ""}
                          onChange={(e) =>
                            setGuidePick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.guidesSelect}</option>
                          {guides.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} — {formatUsd(g.priceUsd)}
                            </option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addGuideEntry(city.id)}
                        >
                          {t.common.add}
                        </Button>
                      </div>

                      {guideEntries.filter((e) => e.cityId === city.id).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.guidesNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {guideEntries
                            .filter((e) => e.cityId === city.id)
                            .map((entry) => {
                              const g = guides.find((x) => x.id === entry.guideId);
                              return (
                                <li key={entry.instanceId} className="flex items-center gap-2">
                                  <span className="flex-1 text-sm">{g?.name ?? "—"}</span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(g?.priceUsd)}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.quantity}
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateGuideEntry(entry.instanceId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-14 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateGuideEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeGuideEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.hotelsHeading}
                  </p>
                  {hotelRateOffers.filter((h) => h.hotel.cityId === city.id).length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.hotelsEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={hotelPick[city.id] ?? ""}
                          onChange={(e) =>
                            setHotelPick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.hotelsSelect}</option>
                          {hotelRateOffers
                            .filter((h) => h.hotel.cityId === city.id)
                            .map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.hotel.name} — {h.room.roomType} ({h.mealPlan}) — {formatUsd(h.sellUsd)}
                              </option>
                            ))}
                        </Select>
                        <Button type="button" variant="secondary" onClick={() => addHotelEntry(city.id)}>
                          {t.common.add}
                        </Button>
                      </div>

                      {hotelEntries.filter((e) => e.cityId === city.id).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.hotelsNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {hotelEntries
                            .filter((e) => e.cityId === city.id)
                            .map((entry) => {
                              const h = hotelRateOffers.find((x) => x.id === entry.hotelRateId);
                              return (
                                <li key={entry.instanceId} className="flex flex-wrap items-center gap-2">
                                  <span className="flex-1 text-sm">
                                    {h ? `${h.hotel.name} — ${h.room.roomType}` : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(h?.sellUsd)}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.nights}
                                    value={entry.nights}
                                    onChange={(e) =>
                                      updateHotelEntry(entry.instanceId, {
                                        nights: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-16 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateHotelEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeHotelEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.restaurantsHeading}
                  </p>
                  {restaurants.filter((r) => r.cityId === city.id).length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.restaurantsEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={restaurantPick[city.id] ?? ""}
                          onChange={(e) =>
                            setRestaurantPick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.restaurantsSelect}</option>
                          {restaurants
                            .filter((r) => r.cityId === city.id)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {localizedName(r, lang)} — {formatUsd(r.pricePerPersonUsd)}
                              </option>
                            ))}
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addRestaurantEntry(city.id)}
                        >
                          {t.common.add}
                        </Button>
                      </div>

                      {restaurantEntries.filter((e) => e.cityId === city.id).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.restaurantsNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {restaurantEntries
                            .filter((e) => e.cityId === city.id)
                            .map((entry) => {
                              const r = restaurants.find((x) => x.id === entry.restaurantId);
                              return (
                                <li key={entry.instanceId} className="flex items-center gap-2">
                                  <span className="flex-1 text-sm">
                                    {r ? localizedName(r, lang) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(r?.pricePerPersonUsd)}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.quantity}
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateRestaurantEntry(entry.instanceId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-14 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateRestaurantEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeRestaurantEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {t.builder.excursionsHeading}
                  </p>
                  {excursions.filter((ex) => ex.cityId === city.id).length === 0 ? (
                    <p className="text-sm text-gray-400">{t.builder.excursionsEmpty}</p>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Select
                          value={excursionPick[city.id] ?? ""}
                          onChange={(e) =>
                            setExcursionPick((prev) => ({ ...prev, [city.id]: e.target.value }))
                          }
                          className="flex-1"
                        >
                          <option value="">{t.builder.excursionsSelect}</option>
                          {excursions
                            .filter((ex) => ex.cityId === city.id)
                            .map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {localizedName(ex, lang)} — {formatUsd(ex.sellUsd)}
                              </option>
                            ))}
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addExcursionEntry(city.id)}
                        >
                          {t.common.add}
                        </Button>
                      </div>

                      {excursionEntries.filter((e) => e.cityId === city.id).length === 0 ? (
                        <p className="text-sm text-gray-400">{t.builder.excursionsNoneSelected}</p>
                      ) : (
                        <ul className="space-y-2">
                          {excursionEntries
                            .filter((e) => e.cityId === city.id)
                            .map((entry) => {
                              const ex = excursions.find((x) => x.id === entry.excursionId);
                              return (
                                <li key={entry.instanceId} className="flex items-center gap-2">
                                  <span className="flex-1 text-sm">
                                    {ex ? localizedName(ex, lang) : "—"}
                                  </span>
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {formatUsd(ex?.sellUsd)}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    title={t.builder.quantity}
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateExcursionEntry(entry.instanceId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-14 py-1"
                                  />
                                  <Select
                                    title={t.builder.day}
                                    value={entry.day}
                                    onChange={(e) =>
                                      updateExcursionEntry(entry.instanceId, {
                                        day: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-20 py-1"
                                  >
                                    {dayOptions.map((d) => (
                                      <option key={d} value={d}>
                                        {d}-{t.builder.dayOption}
                                      </option>
                                    ))}
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeExcursionEntry(entry.instanceId)}
                                    className="text-red-500 px-1"
                                    title={t.builder.remove}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {(trainTickets.length > 0 || flightTickets.length > 0) && (
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3">{t.builder.ticketsHeading}</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                {t.builder.trainHeading}
              </p>
              {trainTickets.length === 0 ? (
                <p className="text-sm text-gray-400">{t.builder.ticketsEmpty}</p>
              ) : (
                <ul className="space-y-2">
                  {trainTickets.map((tk) => (
                    <li key={tk.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tk.id in trainSel}
                        onChange={() =>
                          toggle(trainSel, setTrainSel, tk.id, 1, defaultDayForCity(tk.toCityId))
                        }
                        className="h-4 w-4 rounded accent-indigo-600"
                      />
                      <span className="flex-1 text-sm">
                        {localizedName(tk.fromCity, lang)} → {localizedName(tk.toCity, lang)}
                        {tk.trainName ? ` (${tk.trainName})` : ""}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {formatUsd(tk.priceUsd)}
                      </span>
                      {tk.id in trainSel && (
                        <>
                          <Input
                            type="number"
                            min={1}
                            title={t.builder.quantity}
                            value={trainSel[tk.id].quantity}
                            onChange={(e) =>
                              setQuantity(trainSel, setTrainSel, tk.id, Number(e.target.value))
                            }
                            className="w-14 py-1"
                          />
                          <Select
                            title={t.builder.day}
                            value={trainSel[tk.id].day}
                            onChange={(e) =>
                              setDay(trainSel, setTrainSel, tk.id, Number(e.target.value))
                            }
                            className="w-20 py-1"
                          >
                            {dayOptions.map((d) => (
                              <option key={d} value={d}>
                                {d}-{t.builder.dayOption}
                              </option>
                            ))}
                          </Select>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                {t.builder.flightHeading}
              </p>
              {flightTickets.length === 0 ? (
                <p className="text-sm text-gray-400">{t.builder.ticketsEmpty}</p>
              ) : (
                <ul className="space-y-2">
                  {flightTickets.map((tk) => (
                    <li key={tk.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tk.id in flightSel}
                        onChange={() =>
                          toggle(flightSel, setFlightSel, tk.id, 1, defaultDayForCity(tk.toCityId))
                        }
                        className="h-4 w-4 rounded accent-indigo-600"
                      />
                      <span className="flex-1 text-sm">
                        {localizedName(tk.fromCity, lang)} → {localizedName(tk.toCity, lang)}
                        {tk.airline ? ` (${tk.airline})` : ""}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {formatUsd(tk.priceUsd)}
                      </span>
                      {tk.id in flightSel && (
                        <>
                          <Input
                            type="number"
                            min={1}
                            title={t.builder.quantity}
                            value={flightSel[tk.id].quantity}
                            onChange={(e) =>
                              setQuantity(flightSel, setFlightSel, tk.id, Number(e.target.value))
                            }
                            className="w-14 py-1"
                          />
                          <Select
                            title={t.builder.day}
                            value={flightSel[tk.id].day}
                            onChange={(e) =>
                              setDay(flightSel, setFlightSel, tk.id, Number(e.target.value))
                            }
                            className="w-20 py-1"
                          >
                            {dayOptions.map((d) => (
                              <option key={d} value={d}>
                                {d}-{t.builder.dayOption}
                              </option>
                            ))}
                          </Select>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5 flex flex-wrap items-end justify-between gap-4 sticky bottom-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t.builder.componentCost}
            </p>
            <p className="text-sm tabular-nums text-gray-500 dark:text-white/50">
              {formatUsd(componentTotal.usd)} / {formatUzs(componentTotal.uzs)}
            </p>
          </div>
          <Field label={t.builder.profitUsd} className="w-28">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={profitUsd}
              onChange={(e) => setProfitUsd(e.target.value)}
            />
          </Field>
          <Field label={t.builder.profitUzs} className="w-32">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={profitUzs}
              onChange={(e) => setProfitUzs(e.target.value)}
            />
          </Field>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{t.builder.grandTotal}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatUsd(grandTotal.usd)}{" "}
              <span className="text-base font-normal text-gray-400">
                / {formatUzs(grandTotal.uzs)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/tours")}>
            {t.builder.cancel}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? t.builder.saving : isEdit ? t.builder.update : t.builder.save}
          </Button>
        </div>
      </Card>
    </div>
  );
}
