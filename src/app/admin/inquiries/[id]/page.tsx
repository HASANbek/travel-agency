"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, Input, Select } from "@/components/admin/ui";
import CityChipPicker from "@/components/admin/CityChipPicker";
import { useAdminI18n } from "@/lib/admin-i18n";
import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type Customer = { id: number; firstName: string; lastName: string | null };
type Tour = { id: number; name: string };
type GeneratedPackage = {
  tier: string;
  label: string;
  tour: { id: number; name: string; totalUsd: string; totalUzs: string };
};

type InquiryDetail = {
  id: number;
  customerId: number;
  customer: Customer;
  source: string | null;
  requestDate: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  days: number | null;
  adults: number;
  children: number;
  childrenAges: string | null;
  countries: string | null;
  cities: string | null;
  destinations: string | null;
  budget: string | null;
  currency: string;
  hotelCategory: string | null;
  roomRequirement: string | null;
  mealPlan: string | null;
  transportRequirement: string | null;
  guideRequirement: boolean;
  guideLanguage: string | null;
  excursionRequirement: boolean;
  specialRequests: string | null;
  notes: string | null;
  priority: string;
  status: string;
  responsibleManager: string | null;
  nextFollowUpAt: string | null;
  followUpStep: number;
  tours: Tour[];
};

type NullableStringsToEmpty<T> = {
  [K in keyof T]: T[K] extends string | null ? string : T[K];
};

type FormState = NullableStringsToEmpty<
  Omit<InquiryDetail, "id" | "customerId" | "customer" | "tours">
>;

function toForm(i: InquiryDetail): FormState {
  return {
    source: i.source ?? "",
    requestDate: i.requestDate ?? "",
    travelStartDate: i.travelStartDate ?? "",
    travelEndDate: i.travelEndDate ?? "",
    days: i.days,
    adults: i.adults,
    children: i.children,
    childrenAges: i.childrenAges ?? "",
    countries: i.countries ?? "",
    cities: i.cities ?? "",
    destinations: i.destinations ?? "",
    budget: i.budget ?? "",
    currency: i.currency,
    hotelCategory: i.hotelCategory ?? "",
    roomRequirement: i.roomRequirement ?? "",
    mealPlan: i.mealPlan ?? "",
    transportRequirement: i.transportRequirement ?? "",
    guideRequirement: i.guideRequirement,
    guideLanguage: i.guideLanguage ?? "",
    excursionRequirement: i.excursionRequirement,
    specialRequests: i.specialRequests ?? "",
    notes: i.notes ?? "",
    priority: i.priority,
    status: i.status,
    responsibleManager: i.responsibleManager ?? "",
    nextFollowUpAt: i.nextFollowUpAt ?? "",
    followUpStep: i.followUpStep,
  };
}

export default function InquiryDetailPage() {
  const { t } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [generatingPackages, setGeneratingPackages] = useState(false);
  const [packages, setPackages] = useState<GeneratedPackage[] | null>(null);
  const [packagesError, setPackagesError] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/inquiries/${params.id}`);
    if (!res.ok) {
      setInquiry(null);
      return;
    }
    const data: InquiryDetail = await res.json();
    setInquiry(data);
    setForm(toForm(data));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !inquiry) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/inquiries/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: inquiry.customerId,
        source: form.source || null,
        requestDate: form.requestDate || null,
        travelStartDate: form.travelStartDate || null,
        travelEndDate: form.travelEndDate || null,
        days: form.days ? Number(form.days) : null,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        childrenAges: form.childrenAges || null,
        countries: form.countries || null,
        cities: form.cities || null,
        destinations: form.destinations || null,
        budget: form.budget ? Number(form.budget) : null,
        currency: form.currency,
        hotelCategory: form.hotelCategory || null,
        roomRequirement: form.roomRequirement || null,
        mealPlan: form.mealPlan || null,
        transportRequirement: form.transportRequirement || null,
        guideRequirement: form.guideRequirement,
        guideLanguage: form.guideLanguage || null,
        excursionRequirement: form.excursionRequirement,
        specialRequests: form.specialRequests || null,
        notes: form.notes || null,
        priority: form.priority,
        status: form.status,
        responsibleManager: form.responsibleManager || null,
        nextFollowUpAt: form.nextFollowUpAt || null,
        followUpStep: form.followUpStep,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t.common.cantUpdate);
      return;
    }
    load();
  }

  async function handleConvert() {
    setConverting(true);
    const res = await fetch(`/api/admin/inquiries/${params.id}/convert-to-tour`, {
      method: "POST",
    });
    setConverting(false);
    if (res.ok) {
      const tour = await res.json();
      router.push(`/admin/tours/${tour.id}`);
    }
  }

  async function handleGeneratePackages() {
    setGeneratingPackages(true);
    setPackagesError("");
    const res = await fetch(`/api/admin/inquiries/${params.id}/generate-packages`, {
      method: "POST",
    });
    setGeneratingPackages(false);
    if (!res.ok) {
      setPackagesError(t.inquiries.cantGeneratePackages);
      return;
    }
    setPackages(await res.json());
    load();
  }

  function statusLabel(status: string) {
    const key = `status${status
      .split("_")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}` as keyof typeof t.inquiries;
    return (t.inquiries[key] as string) ?? status;
  }

  function priorityLabel(value: string) {
    if (value === "low") return t.inquiries.priorityLow;
    if (value === "high") return t.inquiries.priorityHigh;
    return t.inquiries.priorityMedium;
  }

  if (!inquiry || !form) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.inquiries.notFound}</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/inquiries")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            #{inquiry.id} ·{" "}
            <Link href={`/admin/customers/${inquiry.customerId}`} className="hover:text-indigo-600">
              {inquiry.customer.firstName} {inquiry.customer.lastName ?? ""}
            </Link>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGeneratePackages} disabled={generatingPackages} variant="secondary">
            {generatingPackages ? t.inquiries.generatingPackages : t.inquiries.generatePackages}
          </Button>
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? t.inquiries.converting : t.inquiries.convertToTour}
          </Button>
        </div>
      </div>

      {packagesError && <p className="text-sm text-red-600 mb-4">{packagesError}</p>}

      {packages && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            {t.inquiries.packagesHeading}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.tier}
                className={`p-5 ${pkg.tier === "standard" ? "ring-2 ring-indigo-500" : ""}`}
              >
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  {pkg.tier === "economy"
                    ? t.inquiries.tierEconomy
                    : pkg.tier === "standard"
                      ? t.inquiries.tierStandard
                      : t.inquiries.tierPremium}
                </p>
                <p className="text-xl font-semibold tabular-nums mb-3">
                  {formatUsd(pkg.tour.totalUsd)}
                  <span className="text-sm font-normal text-gray-400"> / {formatUzs(pkg.tour.totalUzs)}</span>
                </p>
                <Link href={`/admin/tours/${pkg.tour.id}`}>
                  <Button variant="secondary" className="w-full justify-center">
                    {t.inquiries.openInBuilder}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {inquiry.tours.length > 0 && (
        <Card className="p-4 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            {t.customers.historyTours}
          </p>
          <div className="flex flex-wrap gap-2">
            {inquiry.tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/admin/tours/${tour.id}`}
                className="text-sm rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 hover:bg-indigo-100"
              >
                {tour.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={t.inquiries.status}>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.inquiries.priority}>
            <Select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.inquiries.responsibleManager}>
            <Input
              value={form.responsibleManager}
              onChange={(e) => setForm({ ...form, responsibleManager: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.nextFollowUpAt}>
            <Input
              type="date"
              value={form.nextFollowUpAt}
              onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.followUpStep}>
            <Input type="number" value={form.followUpStep} readOnly className="bg-gray-50 dark:bg-white/5" />
          </Field>

          <Field label={t.inquiries.travelStartDate}>
            <Input
              type="date"
              value={form.travelStartDate}
              onChange={(e) => setForm({ ...form, travelStartDate: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.travelEndDate}>
            <Input
              type="date"
              value={form.travelEndDate}
              onChange={(e) => setForm({ ...form, travelEndDate: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.days}>
            <Input
              type="number"
              min={0}
              value={form.days ?? ""}
              onChange={(e) => setForm({ ...form, days: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>

          <Field label={t.inquiries.adults}>
            <Input
              type="number"
              min={1}
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.inquiries.children}>
            <Input
              type="number"
              min={0}
              value={form.children}
              onChange={(e) => setForm({ ...form, children: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.inquiries.childrenAges}>
            <Input
              value={form.childrenAges}
              onChange={(e) => setForm({ ...form, childrenAges: e.target.value })}
              placeholder="5, 8, 12"
            />
          </Field>

          <Field label={t.inquiries.countries}>
            <Input
              value={form.countries}
              onChange={(e) => setForm({ ...form, countries: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.cities}>
            <CityChipPicker
              value={form.cities}
              onChange={(cities) => setForm({ ...form, cities })}
            />
          </Field>
          <Field label={t.inquiries.source}>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </Field>

          <Field label={t.inquiries.budget}>
            <Input
              type="number"
              value={form.budget ?? ""}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.currency}>
            <Select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {["USD", "EUR", "UZS", "GBP", "RUB"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.inquiries.hotelCategory}>
            <Input
              value={form.hotelCategory}
              onChange={(e) => setForm({ ...form, hotelCategory: e.target.value })}
              placeholder="3*, 4*, 5*"
            />
          </Field>

          <Field label={t.inquiries.roomRequirement}>
            <Input
              value={form.roomRequirement}
              onChange={(e) => setForm({ ...form, roomRequirement: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.mealPlan}>
            <Input
              value={form.mealPlan}
              onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}
              placeholder="BB, HB, FB, AI"
            />
          </Field>
          <Field label={t.inquiries.transportRequirement}>
            <Input
              value={form.transportRequirement}
              onChange={(e) => setForm({ ...form, transportRequirement: e.target.value })}
            />
          </Field>

          <Field label={t.inquiries.guideLanguage}>
            <Select
              value={form.guideLanguage}
              onChange={(e) =>
                setForm({
                  ...form,
                  guideLanguage: e.target.value,
                  guideRequirement: Boolean(e.target.value),
                })
              }
            >
              <option value="">{t.common.select}</option>
              {["English", "Русский", "O'zbek", "Français", "Deutsch", "Español"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm pb-2 self-end">
            <input
              type="checkbox"
              checked={form.excursionRequirement}
              onChange={(e) => setForm({ ...form, excursionRequirement: e.target.checked })}
            />
            {t.inquiries.excursionRequirement}
          </label>

          <Field label={t.inquiries.destinations} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.destinations}
              onChange={(e) => setForm({ ...form, destinations: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.specialRequests} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
            />
          </Field>
          <Field label={t.common.notes} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
