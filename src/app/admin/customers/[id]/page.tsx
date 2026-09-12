"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, Input, Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { COMMUNICATION_CHANNELS, CUSTOMER_TYPES, GENDERS } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type Inquiry = {
  id: number;
  status: string;
  travelStartDate: string | null;
  travelEndDate: string | null;
  budget: string | null;
  currency: string;
  createdAt: string;
};

type Tour = {
  id: number;
  name: string;
  totalUsd: string;
  totalUzs: string;
  createdAt: string;
};

type DocumentRow = {
  id: number;
  fileName: string;
  filePath: string;
  notes: string | null;
  createdAt: string;
};

type CommunicationEntry = {
  id: number;
  channel: string;
  direction: string;
  message: string;
  createdAt: string;
};

type CustomerDetail = {
  id: number;
  firstName: string;
  lastName: string | null;
  company: string | null;
  country: string | null;
  nationality: string | null;
  language: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  address: string | null;
  passportNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  customerType: string;
  vipStatus: boolean;
  preferences: string | null;
  notes: string | null;
  tags: string | null;
  source: string | null;
  responsibleManager: string | null;
  inquiries: Inquiry[];
  tours: Tour[];
};

type NullableStringsToEmpty<T> = {
  [K in keyof T]: T[K] extends string | null ? string : T[K];
};

type FormState = NullableStringsToEmpty<Omit<CustomerDetail, "id" | "inquiries" | "tours">>;

function toForm(c: CustomerDetail): FormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName ?? "",
    company: c.company ?? "",
    country: c.country ?? "",
    nationality: c.nationality ?? "",
    language: c.language ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    whatsapp: c.whatsapp ?? "",
    telegram: c.telegram ?? "",
    address: c.address ?? "",
    passportNumber: c.passportNumber ?? "",
    dateOfBirth: c.dateOfBirth ?? "",
    gender: c.gender ?? "",
    customerType: c.customerType,
    vipStatus: c.vipStatus,
    preferences: c.preferences ?? "",
    notes: c.notes ?? "",
    tags: c.tags ?? "",
    source: c.source ?? "",
    responsibleManager: c.responsibleManager ?? "",
  };
}

export default function CustomerDetailPage() {
  const { t } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<CommunicationEntry[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({ channel: "whatsapp", direction: "outbound", message: "" });

  async function load() {
    const res = await fetch(`/api/admin/customers/${params.id}`);
    if (!res.ok) {
      setCustomer(null);
      return;
    }
    const data: CustomerDetail = await res.json();
    setCustomer(data);
    setForm(toForm(data));
  }

  async function loadDocuments() {
    const res = await fetch(`/api/admin/documents?customerId=${params.id}`);
    if (res.ok) setDocuments(await res.json());
  }

  async function loadLogs() {
    const res = await fetch(`/api/admin/communication-log?customerId=${params.id}`);
    if (res.ok) setLogs(await res.json());
  }

  useEffect(() => {
    load();
    loadDocuments();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logForm.message.trim()) return;
    await fetch("/api/admin/communication-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: Number(params.id),
        channel: logForm.channel,
        direction: logForm.direction,
        message: logForm.message,
      }),
    });
    setLogForm({ channel: "whatsapp", direction: "outbound", message: "" });
    setShowLogForm(false);
    loadLogs();
  }

  function channelLabel(channel: string) {
    const key = `channel${channel[0].toUpperCase()}${channel.slice(1)}` as keyof typeof t.communication;
    return (t.communication[key] as string) ?? channel;
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("customerId", String(params.id));
    await fetch("/api/admin/documents", { method: "POST", body: formData });
    setUploading(false);
    e.target.value = "";
    loadDocuments();
  }

  async function handleDeleteDocument(id: number) {
    if (!confirm(t.documents.confirmDelete)) return;
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
    loadDocuments();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/customers/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lastName: form.lastName || null,
        company: form.company || null,
        country: form.country || null,
        nationality: form.nationality || null,
        language: form.language || null,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        telegram: form.telegram || null,
        address: form.address || null,
        passportNumber: form.passportNumber || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        preferences: form.preferences || null,
        notes: form.notes || null,
        tags: form.tags || null,
        source: form.source || null,
        responsibleManager: form.responsibleManager || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t.common.cantUpdate);
      return;
    }
    load();
  }

  function statusLabel(status: string) {
    const key = `status${status
      .split("_")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}` as keyof typeof t.inquiries;
    return (t.inquiries[key] as string) ?? status;
  }

  function customerTypeLabel(value: string) {
    if (value === "company") return t.customers.customerTypeCompany;
    if (value === "agency") return t.customers.customerTypeAgency;
    return t.customers.customerTypeIndividual;
  }

  function genderLabel(value: string) {
    if (value === "male") return t.customers.genderMale;
    if (value === "female") return t.customers.genderFemale;
    if (value === "other") return t.customers.genderOther;
    return "";
  }

  if (!customer || !form) {
    return (
      <div className="text-sm text-gray-500 dark:text-white/50">{t.customers.notFound}</div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/customers")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {customer.firstName} {customer.lastName ?? ""}
        </h2>
        {customer.vipStatus && (
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-1">
            VIP
          </span>
        )}
      </div>

      <Card className="p-5 mb-6">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={t.customers.firstName}>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </Field>
          <Field label={t.customers.lastName}>
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label={t.customers.company}>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </Field>
          <Field label={t.common.phone}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label={t.common.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label={t.customers.whatsapp}>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </Field>
          <Field label={t.customers.telegram}>
            <Input
              value={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
            />
          </Field>
          <Field label={t.customers.country}>
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </Field>
          <Field label={t.customers.nationality}>
            <Input
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            />
          </Field>
          <Field label={t.customers.language}>
            <Input
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />
          </Field>
          <Field label={t.customers.passportNumber}>
            <Input
              value={form.passportNumber}
              onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
            />
          </Field>
          <Field label={t.customers.dateOfBirth}>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </Field>
          <Field label={t.customers.gender}>
            <Select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">{t.common.select}</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {genderLabel(g)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.customers.customerType}>
            <Select
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value })}
            >
              {CUSTOMER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {customerTypeLabel(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.customers.source}>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder={t.customers.sourcePlaceholder}
            />
          </Field>
          <Field label={t.customers.responsibleManager}>
            <Input
              value={form.responsibleManager}
              onChange={(e) => setForm({ ...form, responsibleManager: e.target.value })}
            />
          </Field>
          <Field label={t.customers.tags}>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder={t.customers.tagsPlaceholder}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm pb-2 self-end">
            <input
              type="checkbox"
              checked={form.vipStatus}
              onChange={(e) => setForm({ ...form, vipStatus: e.target.checked })}
            />
            {t.customers.vipStatus}
          </label>
          <Field label={t.customers.address} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label={t.customers.preferences} className="sm:col-span-2 lg:col-span-3">
            <Input
              value={form.preferences}
              onChange={(e) => setForm({ ...form, preferences: e.target.value })}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            {t.customers.historyInquiries}
          </h3>
          {customer.inquiries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-white/40">{t.customers.noInquiries}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
              {customer.inquiries.map((inq) => (
                <li key={inq.id} className="py-2.5 flex items-center justify-between text-sm">
                  <Link href={`/admin/inquiries/${inq.id}`} className="hover:text-indigo-600">
                    #{inq.id} · {inq.travelStartDate || "—"} → {inq.travelEndDate || "—"}
                  </Link>
                  <span className="text-xs rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1">
                    {statusLabel(inq.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            {t.customers.historyTours}
          </h3>
          {customer.tours.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-white/40">{t.customers.noTours}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
              {customer.tours.map((tour) => (
                <li key={tour.id} className="py-2.5 flex items-center justify-between text-sm">
                  <Link href={`/admin/tours/${tour.id}`} className="hover:text-indigo-600">
                    {tour.name}
                  </Link>
                  <span className="tabular-nums text-gray-500 dark:text-white/50">
                    {formatUsd(tour.totalUsd)} / {formatUzs(tour.totalUzs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.documents.heading}
          </h3>
          <label className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 text-sm font-medium shadow-sm cursor-pointer transition">
            {uploading ? t.documents.uploading : t.documents.upload}
            <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
          </label>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.documents.empty}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {documents.map((doc) => (
              <li key={doc.id} className="py-2.5 flex items-center justify-between text-sm">
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-600 truncate"
                >
                  📎 {doc.fileName}
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md"
                >
                  {t.common.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.communication.heading}
          </h3>
          <Button onClick={() => setShowLogForm((v) => !v)} variant="secondary">
            {t.communication.addButton}
          </Button>
        </div>

        {showLogForm && (
          <form
            onSubmit={handleAddLog}
            className="flex flex-wrap items-end gap-3 mb-4 border-b border-gray-100 dark:border-white/10 pb-4"
          >
            <Field label={t.communication.channel} className="w-36">
              <Select
                value={logForm.channel}
                onChange={(e) => setLogForm({ ...logForm, channel: e.target.value })}
              >
                {COMMUNICATION_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {channelLabel(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.communication.direction} className="w-48">
              <Select
                value={logForm.direction}
                onChange={(e) => setLogForm({ ...logForm, direction: e.target.value })}
              >
                <option value="outbound">{t.communication.directionOutbound}</option>
                <option value="inbound">{t.communication.directionInbound}</option>
              </Select>
            </Field>
            <Field label={t.communication.message} className="flex-1 min-w-[220px]">
              <Input
                value={logForm.message}
                onChange={(e) => setLogForm({ ...logForm, message: e.target.value })}
                required
              />
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
        )}

        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.communication.empty}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {logs.map((log) => (
              <li key={log.id} className="py-2.5 text-sm">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{channelLabel(log.channel)}</span>
                  <span>·</span>
                  <span>
                    {log.direction === "inbound"
                      ? t.communication.directionInbound
                      : t.communication.directionOutbound}
                  </span>
                  <span>·</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p>{log.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
