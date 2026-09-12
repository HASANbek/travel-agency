"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/admin/ui";
import CityChipPicker from "@/components/admin/CityChipPicker";
import { useAdminI18n } from "@/lib/admin-i18n";
import { INQUIRY_STATUSES, PRIORITIES } from "@/lib/crm-constants";

type Customer = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

type AiExtracted = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  adults: number | null;
  children: number | null;
  cities: string | null;
  budget: number | null;
  currency: string | null;
  hotelCategory: string | null;
  mealPlan: string | null;
  transportRequirement: string | null;
  guideLanguage: string | null;
  specialRequests: string | null;
};

const emptyForm = {
  customerId: "",
  travelStartDate: "",
  travelEndDate: "",
  adults: "2",
  children: "0",
  cities: "",
  budget: "",
  currency: "USD",
  hotelCategory: "",
  transportRequirement: "",
  guideLanguage: "",
  mealPlan: "",
  specialRequests: "",
  priority: "medium",
  status: "new",
};

export default function NewInquiryPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [unmatchedContact, setUnmatchedContact] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  async function loadCustomers() {
    const res = await fetch("/api/admin/customers");
    setCustomers(await res.json());
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function applyExtracted(data: AiExtracted, customerId?: number) {
    setForm((prev) => ({
      ...prev,
      customerId: customerId ? String(customerId) : prev.customerId,
      travelStartDate: data.travelStartDate || prev.travelStartDate,
      travelEndDate: data.travelEndDate || prev.travelEndDate,
      adults: data.adults ? String(data.adults) : prev.adults,
      children: data.children !== null && data.children !== undefined ? String(data.children) : prev.children,
      cities: data.cities || prev.cities,
      budget: data.budget ? String(data.budget) : prev.budget,
      currency: data.currency || prev.currency,
      hotelCategory: data.hotelCategory || prev.hotelCategory,
      transportRequirement: data.transportRequirement || prev.transportRequirement,
      guideLanguage: data.guideLanguage || prev.guideLanguage,
      mealPlan: data.mealPlan || prev.mealPlan,
      specialRequests: data.specialRequests || prev.specialRequests,
    }));
  }

  async function handleAiParse() {
    if (!aiMessage.trim()) return;
    setAiLoading(true);
    setAiError("");
    setUnmatchedContact(null);
    try {
      const res = await fetch("/api/admin/ai/parse-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiMessage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAiError(err.error ? String(err.error) : t.inquiries.aiError);
        return;
      }
      const data: AiExtracted = await res.json();

      const emailLower = data.email?.toLowerCase().trim();
      const phoneDigits = data.phone?.replace(/\D/g, "");
      const match = customers.find(
        (c) =>
          (emailLower && c.email?.toLowerCase().trim() === emailLower) ||
          (phoneDigits && phoneDigits.length >= 6 && c.phone?.replace(/\D/g, "") === phoneDigits)
      );

      if (match) {
        applyExtracted(data, match.id);
      } else if (data.firstName || data.email || data.phone) {
        applyExtracted(data);
        setUnmatchedContact({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } else {
        applyExtracted(data);
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreateUnmatchedCustomer() {
    if (!unmatchedContact || !unmatchedContact.firstName) return;
    setCreatingCustomer(true);
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: unmatchedContact.firstName,
        lastName: unmatchedContact.lastName || null,
        email: unmatchedContact.email || null,
        phone: unmatchedContact.phone || null,
        customerType: "individual",
        source: "AI",
      }),
    });
    setCreatingCustomer(false);
    if (!res.ok) return;
    const customer: Customer = await res.json();
    await loadCustomers();
    setForm((prev) => ({ ...prev, customerId: String(customer.id) }));
    setUnmatchedContact(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) {
      setError(t.inquiries.selectCustomer);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: Number(form.customerId),
        requestDate: new Date().toISOString().slice(0, 10),
        travelStartDate: form.travelStartDate || null,
        travelEndDate: form.travelEndDate || null,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        cities: form.cities || null,
        budget: form.budget ? Number(form.budget) : null,
        currency: form.currency,
        hotelCategory: form.hotelCategory || null,
        transportRequirement: form.transportRequirement || null,
        guideRequirement: Boolean(form.guideLanguage),
        guideLanguage: form.guideLanguage || null,
        mealPlan: form.mealPlan || null,
        specialRequests: form.specialRequests || null,
        priority: form.priority,
        status: form.status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t.inquiries.cantAdd);
      return;
    }
    const inquiry = await res.json();
    router.push(`/admin/inquiries/${inquiry.id}`);
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/inquiries")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>
      <PageHeader title={t.inquiries.addButton.replace("+ ", "")} description={t.inquiries.description} />

      <Card className="p-5 mb-6 border-indigo-200 dark:border-indigo-500/30">
        <p className="text-sm font-semibold mb-1">🤖 {t.inquiries.aiHeading}</p>
        <p className="text-xs text-gray-500 dark:text-white/50 mb-3">{t.inquiries.aiDescription}</p>
        <textarea
          value={aiMessage}
          onChange={(e) => setAiMessage(e.target.value)}
          placeholder={t.inquiries.aiPlaceholder}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/[0.08] px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 mb-3"
        />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleAiParse} disabled={aiLoading || !aiMessage.trim()}>
            {aiLoading ? t.inquiries.aiParsing : t.inquiries.aiParseButton}
          </Button>
          {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        </div>

        {unmatchedContact && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
              {t.inquiries.aiNoCustomerMatch}: <strong>{unmatchedContact.firstName} {unmatchedContact.lastName}</strong>
              {unmatchedContact.email && ` · ${unmatchedContact.email}`}
              {unmatchedContact.phone && ` · ${unmatchedContact.phone}`}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCreateUnmatchedCustomer}
              disabled={creatingCustomer || !unmatchedContact.firstName}
            >
              {creatingCustomer ? t.builder.saving : t.inquiries.aiCreateCustomer}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={t.inquiries.customer}>
            <Select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">{t.inquiries.selectCustomer}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName ?? ""}
                </option>
              ))}
            </Select>
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

          <Field label={t.inquiries.adults}>
            <Input
              type="number"
              min={1}
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: e.target.value })}
            />
          </Field>
          <Field label={t.inquiries.children}>
            <Input
              type="number"
              min={0}
              value={form.children}
              onChange={(e) => setForm({ ...form, children: e.target.value })}
            />
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

          <Field label={t.inquiries.cities} className="sm:col-span-2 lg:col-span-3">
            <CityChipPicker
              value={form.cities}
              onChange={(cities) => setForm({ ...form, cities })}
            />
          </Field>

          <Field label={t.inquiries.budget}>
            <Input
              type="number"
              value={form.budget}
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
            <Select
              value={form.hotelCategory}
              onChange={(e) => setForm({ ...form, hotelCategory: e.target.value })}
            >
              <option value="">{t.common.select}</option>
              {["3*", "4*", "5*"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t.inquiries.transportRequirement}>
            <Input
              value={form.transportRequirement}
              onChange={(e) => setForm({ ...form, transportRequirement: e.target.value })}
              placeholder="Transfer + Intercity"
            />
          </Field>
          <Field label={t.inquiries.guideLanguage}>
            <Select
              value={form.guideLanguage}
              onChange={(e) => setForm({ ...form, guideLanguage: e.target.value })}
            >
              <option value="">{t.common.select}</option>
              {["English", "Русский", "O'zbek", "Français", "Deutsch", "Español"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.inquiries.mealPlan}>
            <Select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}>
              <option value="">{t.common.select}</option>
              {["RO", "BB", "HB", "FB", "AI"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t.inquiries.specialRequests} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              placeholder="Airport transfer, train Samarkand - Bukhara..."
            />
          </Field>

          <Field label={t.inquiries.status}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
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
