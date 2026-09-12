import { jsPDF } from "jspdf";
import { formatUsd, formatUzs } from "@/lib/format";
import { AdminLang, getPdfDict } from "@/lib/admin-i18n";
import { PT_SANS_BOLD_BASE64, PT_SANS_REGULAR_BASE64 } from "@/lib/pt-sans-font";
import { localizedName } from "@/lib/localize";

type City = { id: number; name: string; nameRu?: string | null; nameEn?: string | null };
type NamedEntity = { name: string; nameRu?: string | null; nameEn?: string | null };

export type TourPdfData = {
  id: number;
  name: string;
  notes: string | null;
  totalUsd: string | number;
  totalUzs: string | number;
  cities: { position: number; city: City }[];
  attractions: { day: number; attraction: NamedEntity & { city: City } }[];
  localTransports: {
    day: number;
    time?: string | null;
    localTransport: NamedEntity & { city: City };
  }[];
  guides: { day: number; guide: { name: string; city: City } }[];
  trainTickets: {
    day: number;
    trainTicket: { trainName: string | null; fromCity: City; toCity: City };
  }[];
  flightTickets: {
    day: number;
    flightTicket: { airline: string | null; fromCity: City; toCity: City };
  }[];
  hotelRates?: {
    day: number;
    nights: number;
    hotel: NamedEntity & { city: City };
    rate: { room: { roomType: string }; mealPlan: string };
  }[];
  restaurants?: { day: number; restaurant: NamedEntity & { city: City } }[];
  excursions?: { day: number; excursion: NamedEntity & { city: City } }[];
};

const INDIGO: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [23, 23, 23];
const MUTED: [number, number, number] = [110, 110, 110];
const LIGHT_LINE: [number, number, number] = [225, 225, 232];

const FONT = "PTSans";

export type QuotationPdfData = {
  discountUsd?: string | number | null;
  discountUzs?: string | number | null;
  validUntil?: string | null;
};

export function generateTourPdf(
  tour: TourPdfData,
  lang: AdminLang = "uz",
  quotation?: QuotationPdfData
) {
  const pdf = getPdfDict(lang);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // PT Sans covers Latin + Cyrillic, unlike jsPDF's built-in Helvetica (Latin-only) —
  // needed so Russian labels actually render instead of showing blank/garbled glyphs.
  doc.addFileToVFS("PTSans-Regular.ttf", PT_SANS_REGULAR_BASE64);
  doc.addFont("PTSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("PTSans-Bold.ttf", PT_SANS_BOLD_BASE64);
  doc.addFont("PTSans-Bold.ttf", FONT, "bold");

  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginX * 2;
  let y = 0;

  function ensureSpace(next: number) {
    if (y + next > pageHeight - 70) {
      doc.addPage();
      y = 56;
    }
  }

  const sortedCities = tour.cities.slice().sort((a, b) => a.position - b.position);
  const routeLine = sortedCities.map((c) => localizedName(c.city, lang)).join("   ->   ");

  // ---- Group every selected item by its assigned day ----
  const dayNumbers = new Set<number>();
  tour.attractions.forEach((a) => dayNumbers.add(a.day));
  tour.localTransports.forEach((t) => dayNumbers.add(t.day));
  tour.guides.forEach((g) => dayNumbers.add(g.day));
  tour.trainTickets.forEach((t) => dayNumbers.add(t.day));
  tour.flightTickets.forEach((t) => dayNumbers.add(t.day));
  (tour.hotelRates ?? []).forEach((h) => dayNumbers.add(h.day));
  (tour.restaurants ?? []).forEach((r) => dayNumbers.add(r.day));
  (tour.excursions ?? []).forEach((e) => dayNumbers.add(e.day));
  const maxDay = dayNumbers.size > 0 ? Math.max(...Array.from(dayNumbers)) : sortedCities.length;
  const dayCount = Math.max(maxDay, sortedCities.length, 1);

  // ---- Header banner ----
  const bannerHeight = 92;
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageWidth, bannerHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(FONT, "normal");
  doc.text(pdf.brand, marginX, 30);

  doc.setFontSize(20);
  doc.setFont(FONT, "bold");
  doc.text(tour.name, marginX, 56);

  doc.setFontSize(10);
  doc.setFont(FONT, "normal");
  const nights = Math.max(dayCount - 1, 0);
  doc.text(`${dayCount} ${pdf.days} / ${nights} ${pdf.nights}`, marginX, 76);

  y = bannerHeight + 24;

  if (routeLine) {
    doc.setFontSize(10);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    const routeLines = doc.splitTextToSize(`${pdf.route}: ${routeLine}`, contentWidth);
    doc.text(routeLines, marginX, y);
    y += routeLines.length * 13 + 12;
  }

  function drawDivider() {
    doc.setDrawColor(...LIGHT_LINE);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;
  }

  function drawTransit(label: string) {
    ensureSpace(18);
    doc.setFontSize(9.5);
    doc.setFont(FONT, "bold");
    doc.setTextColor(...INDIGO);
    doc.text(label, marginX + 32, y);
    y += 16;
  }

  function drawBullet(text: string) {
    ensureSpace(16);
    doc.setFontSize(10.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`-  ${text}`, contentWidth - 32);
    doc.text(lines, marginX + 32, y);
    y += lines.length * 14;
  }

  // ---- Day-by-day itinerary, grouped by the manually assigned `day` field ----
  for (let day = 1; day <= dayCount; day++) {
    const dayAttractions = tour.attractions.filter((a) => a.day === day);
    const dayTransports = tour.localTransports.filter((t) => t.day === day);
    const dayGuides = tour.guides.filter((g) => g.day === day);
    const dayTrains = tour.trainTickets.filter((t) => t.day === day);
    const dayFlights = tour.flightTickets.filter((t) => t.day === day);
    const dayHotels = (tour.hotelRates ?? []).filter((h) => h.day === day);
    const dayRestaurants = (tour.restaurants ?? []).filter((r) => r.day === day);
    const dayExcursions = (tour.excursions ?? []).filter((e) => e.day === day);

    const citiesToday = new Set<string>();
    dayAttractions.forEach((a) => citiesToday.add(localizedName(a.attraction.city, lang)));
    dayTransports.forEach((t) => citiesToday.add(localizedName(t.localTransport.city, lang)));
    dayGuides.forEach((g) => citiesToday.add(localizedName(g.guide.city, lang)));
    dayHotels.forEach((h) => citiesToday.add(localizedName(h.hotel.city, lang)));
    dayRestaurants.forEach((r) => citiesToday.add(localizedName(r.restaurant.city, lang)));
    dayExcursions.forEach((e) => citiesToday.add(localizedName(e.excursion.city, lang)));
    if (citiesToday.size === 0 && sortedCities[day - 1]) {
      citiesToday.add(localizedName(sortedCities[day - 1].city, lang));
    }

    ensureSpace(30);
    doc.setFillColor(...INDIGO);
    doc.circle(marginX + 10, y - 4, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(FONT, "bold");
    doc.text(String(day), marginX + 10, y - 1, { align: "center" });

    doc.setTextColor(...INK);
    doc.setFontSize(13);
    doc.setFont(FONT, "bold");
    const heading = citiesToday.size > 0 ? Array.from(citiesToday).join(", ") : pdf.freeDay;
    doc.text(heading, marginX + 28, y);
    y += 20;

    for (const t of dayTrains) {
      drawTransit(
        `${pdf.train}: ${localizedName(t.trainTicket.fromCity, lang)} -> ${localizedName(t.trainTicket.toCity, lang)}` +
          (t.trainTicket.trainName ? ` (${t.trainTicket.trainName})` : "")
      );
    }
    for (const t of dayFlights) {
      drawTransit(
        `${pdf.flight}: ${localizedName(t.flightTicket.fromCity, lang)} -> ${localizedName(t.flightTicket.toCity, lang)}` +
          (t.flightTicket.airline ? ` (${t.flightTicket.airline})` : "")
      );
    }

    if (
      dayAttractions.length === 0 &&
      dayTransports.length === 0 &&
      dayGuides.length === 0 &&
      dayHotels.length === 0 &&
      dayRestaurants.length === 0 &&
      dayExcursions.length === 0
    ) {
      drawBullet(pdf.freeTime);
    }
    for (const h of dayHotels) {
      drawBullet(
        `${pdf.hotelPrefix}: ${localizedName(h.hotel, lang)} (${h.rate.room.roomType}, ${h.rate.mealPlan}, ${h.nights} ${pdf.nights})`
      );
    }
    for (const a of dayAttractions) {
      drawBullet(localizedName(a.attraction, lang));
    }
    for (const ex of dayExcursions) {
      drawBullet(localizedName(ex.excursion, lang));
    }
    for (const t of dayTransports) {
      drawBullet(
        `${localizedName(t.localTransport, lang)} (${pdf.transportSuffix})` +
          (t.time ? ` — ${t.time}` : "")
      );
    }
    for (const g of dayGuides) {
      drawBullet(`${pdf.guidePrefix}: ${g.guide.name}`);
    }
    for (const r of dayRestaurants) {
      drawBullet(`${pdf.restaurantPrefix}: ${localizedName(r.restaurant, lang)}`);
    }

    y += 10;
    if (day < dayCount) drawDivider();
  }

  if (tour.notes) {
    ensureSpace(40);
    doc.setFontSize(12);
    doc.setFont(FONT, "bold");
    doc.setTextColor(...INK);
    doc.text(pdf.notes, marginX, y);
    y += 18;
    doc.setFontSize(10.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    const noteLines = doc.splitTextToSize(tour.notes, contentWidth);
    doc.text(noteLines, marginX, y);
    y += noteLines.length * 14 + 10;
  }

  // ---- Total price (with optional quotation discount) ----
  const hasDiscount =
    !!quotation &&
    ((quotation.discountUsd && Number(quotation.discountUsd) > 0) ||
      (quotation.discountUzs && Number(quotation.discountUzs) > 0));
  const finalUsd = Number(tour.totalUsd) - Number(quotation?.discountUsd || 0);
  const finalUzs = Number(tour.totalUzs) - Number(quotation?.discountUzs || 0);

  const boxHeight = hasDiscount ? 92 : 60;
  ensureSpace(boxHeight + 30);
  y += 6;
  doc.setFillColor(247, 247, 252);
  doc.roundedRect(marginX, y, contentWidth, boxHeight, 8, 8, "F");
  doc.setFontSize(10.5);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...MUTED);
  doc.text(pdf.totalPrice, marginX + 18, y + 24);
  doc.setFontSize(19);
  doc.setFont(FONT, "bold");
  doc.setTextColor(...INK);
  doc.text(`${formatUsd(tour.totalUsd)}  /  ${formatUzs(tour.totalUzs)}`, marginX + 18, y + 46);

  if (hasDiscount) {
    doc.setFontSize(10.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    doc.text(
      `${pdf.discount}: -${formatUsd(quotation?.discountUsd || 0)}  /  -${formatUzs(
        quotation?.discountUzs || 0
      )}`,
      marginX + 18,
      y + 64
    );
    doc.setFontSize(15);
    doc.setFont(FONT, "bold");
    doc.setTextColor(...INDIGO);
    doc.text(
      `${pdf.finalPrice}: ${formatUsd(finalUsd)}  /  ${formatUzs(finalUzs)}`,
      marginX + 18,
      y + 84
    );
  }
  y += boxHeight;

  if (quotation?.validUntil) {
    y += 20;
    ensureSpace(16);
    doc.setFontSize(9.5);
    doc.setFont(FONT, "normal");
    doc.setTextColor(...MUTED);
    doc.text(`${pdf.validUntil}: ${quotation.validUntil}`, marginX, y);
  }

  const safeName = tour.name.replace(/[\\/:*?"<>|]/g, "").trim() || "tur";
  doc.save(`${safeName}.pdf`);
}
