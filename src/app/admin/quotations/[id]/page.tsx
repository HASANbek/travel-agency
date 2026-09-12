"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, Input, Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { QUOTATION_STATUSES } from "@/lib/crm-constants";
import { generateTourPdf } from "@/lib/tour-pdf";
import { formatUsd, formatUzs } from "@/lib/format";

type Tour = { id: number; name: string; totalUsd: string; totalUzs: string };
type Customer = { id: number; firstName: string; lastName: string | null };

type LineItem = { unitPriceUsd: string | null; unitPriceUzs: string | null; quantity: number };
type HotelLineItem = LineItem & { nights: number };

type TourBreakdown = {
  profitUsd: string;
  profitUzs: string;
  attractions: LineItem[];
  localTransports: LineItem[];
  guides: LineItem[];
  hotelRates: HotelLineItem[];
  restaurants: LineItem[];
  excursions: LineItem[];
  trainTickets: LineItem[];
  flightTickets: LineItem[];
};

type CategoryTotal = { labelKey: string; usd: number; uzs: number };

function sumItems(items: LineItem[]): { usd: number; uzs: number } {
  return items.reduce(
    (acc, i) => ({
      usd: acc.usd + Number(i.unitPriceUsd ?? 0) * i.quantity,
      uzs: acc.uzs + Number(i.unitPriceUzs ?? 0) * i.quantity,
    }),
    { usd: 0, uzs: 0 }
  );
}

function computeCategoryBreakdown(tour: TourBreakdown): CategoryTotal[] {
  const hotel = tour.hotelRates.reduce(
    (acc, i) => ({
      usd: acc.usd + Number(i.unitPriceUsd ?? 0) * i.quantity * i.nights,
      uzs: acc.uzs + Number(i.unitPriceUzs ?? 0) * i.quantity * i.nights,
    }),
    { usd: 0, uzs: 0 }
  );
  const transport = sumItems(tour.localTransports);
  const guide = sumItems(tour.guides);
  const excursionsAndSights = {
    usd: sumItems(tour.excursions).usd + sumItems(tour.attractions).usd,
    uzs: sumItems(tour.excursions).uzs + sumItems(tour.attractions).uzs,
  };
  const meals = sumItems(tour.restaurants);
  const other = {
    usd: sumItems(tour.trainTickets).usd + sumItems(tour.flightTickets).usd,
    uzs: sumItems(tour.trainTickets).uzs + sumItems(tour.flightTickets).uzs,
  };

  return [
    { labelKey: "breakdownHotel", ...hotel },
    { labelKey: "breakdownTransport", ...transport },
    { labelKey: "breakdownGuide", ...guide },
    { labelKey: "breakdownExcursions", ...excursionsAndSights },
    { labelKey: "breakdownMeals", ...meals },
    { labelKey: "breakdownOther", ...other },
  ].filter((c) => c.usd > 0 || c.uzs > 0);
}

type QuotationDetail = {
  id: number;
  tourId: number;
  version: number;
  status: string;
  discountUsd: string | null;
  discountUzs: string | null;
  taxPercent: string | null;
  validUntil: string | null;
  terms: string | null;
  tour: Tour;
  customer: Customer | null;
};

type FormState = {
  discountUsd: string;
  discountUzs: string;
  taxPercent: string;
  validUntil: string;
  terms: string;
  status: string;
};

export default function QuotationDetailPage() {
  const { t, lang } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [breakdown, setBreakdown] = useState<{
    categories: CategoryTotal[];
    profitUsd: string;
    profitUzs: string;
  } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/quotations/${params.id}`);
    if (!res.ok) {
      setQuotation(null);
      return;
    }
    const data: QuotationDetail = await res.json();
    setQuotation(data);
    setForm({
      discountUsd: data.discountUsd ?? "",
      discountUzs: data.discountUzs ?? "",
      taxPercent: data.taxPercent ?? "",
      validUntil: data.validUntil ?? "",
      terms: data.terms ?? "",
      status: data.status,
    });

    const tourRes = await fetch(`/api/admin/tours/${data.tourId}`);
    if (tourRes.ok) {
      const tourData: TourBreakdown = await tourRes.json();
      setBreakdown({
        categories: computeCategoryBreakdown(tourData),
        profitUsd: tourData.profitUsd,
        profitUzs: tourData.profitUzs,
      });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function statusLabel(status: string) {
    const key = `status${status[0].toUpperCase()}${status.slice(1)}` as keyof typeof t.quotations;
    return (t.quotations[key] as string) ?? status;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/quotations/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        discountUsd: form.discountUsd ? Number(form.discountUsd) : null,
        discountUzs: form.discountUzs ? Number(form.discountUzs) : null,
        taxPercent: form.taxPercent ? Number(form.taxPercent) : null,
        validUntil: form.validUntil || null,
        terms: form.terms || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t.common.cantUpdate);
      return;
    }
    load();
  }

  async function handleGeneratePdf() {
    if (!quotation || !form) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/tours/${quotation.tourId}`);
      const tourData = await res.json();
      generateTourPdf(tourData, lang, {
        discountUsd: form.discountUsd || null,
        discountUzs: form.discountUzs || null,
        validUntil: form.validUntil || null,
      });
      if (quotation.status === "draft") {
        await fetch(`/api/admin/quotations/${quotation.id}/send`, { method: "POST" });
        load();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateBooking() {
    if (!quotation) return;
    setCreatingBooking(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: quotation.tourId, quotationId: quotation.id }),
      });
      if (res.ok) {
        const booking = await res.json();
        router.push(`/admin/bookings/${booking.id}`);
      }
    } finally {
      setCreatingBooking(false);
    }
  }

  if (!quotation || !form) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.quotations.notFound}</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/quotations")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            <Link href={`/admin/tours/${quotation.tourId}`} className="hover:text-indigo-600">
              {quotation.tour.name}
            </Link>{" "}
            <span className="text-gray-400 font-normal">v{quotation.version}</span>
          </h2>
          {quotation.customer && (
            <Link
              href={`/admin/customers/${quotation.customer.id}`}
              className="text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
            >
              {quotation.customer.firstName} {quotation.customer.lastName ?? ""}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGeneratePdf} disabled={generating} variant="secondary">
            {generating ? t.quotations.pdfPreparing : t.quotations.generatePdf}
          </Button>
          <Button onClick={handleCreateBooking} disabled={creatingBooking}>
            {creatingBooking ? t.bookings.creatingBooking : t.bookings.createBooking}
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-white/50">{t.tours.colPrice}</span>
        <span className="tabular-nums font-medium">
          {formatUsd(quotation.tour.totalUsd)} / {formatUzs(quotation.tour.totalUzs)}
        </span>
      </Card>

      {breakdown && (
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            {t.quotations.breakdownHeading}
          </h3>
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {breakdown.categories.map((c) => (
              <li key={c.labelKey} className="py-2 flex items-center justify-between text-sm">
                <span>{t.quotations[c.labelKey as keyof typeof t.quotations] as string}</span>
                <span className="tabular-nums">
                  {formatUsd(c.usd)} / {formatUzs(c.uzs)}
                </span>
              </li>
            ))}
            <li className="py-2 flex items-center justify-between text-sm font-medium">
              <span>{t.quotations.breakdownProfit}</span>
              <span className="tabular-nums">
                {formatUsd(breakdown.profitUsd)} / {formatUzs(breakdown.profitUzs)}
              </span>
            </li>
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={t.quotations.status}>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {QUOTATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.quotations.validUntil}>
            <Input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </Field>
          <Field label={t.quotations.taxPercent}>
            <Input
              type="number"
              step="0.01"
              value={form.taxPercent}
              onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
            />
          </Field>

          <Field label={t.quotations.discountUsd}>
            <Input
              type="number"
              step="0.01"
              value={form.discountUsd}
              onChange={(e) => setForm({ ...form, discountUsd: e.target.value })}
            />
          </Field>
          <Field label={t.quotations.discountUzs}>
            <Input
              type="number"
              step="0.01"
              value={form.discountUzs}
              onChange={(e) => setForm({ ...form, discountUzs: e.target.value })}
            />
          </Field>

          <Field label={t.quotations.terms} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder={t.quotations.termsPlaceholder}
            />
          </Field>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? t.builder.saving : t.common.save}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}
