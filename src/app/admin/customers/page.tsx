"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { CUSTOMER_TYPES } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type Customer = {
  id: number;
  firstName: string;
  lastName: string | null;
  company: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  customerType: string;
  vipStatus: boolean;
  source: string | null;
  createdAt: string;
  tripsCount: number;
  totalSpentUsd: number;
  totalSpentUzs: number;
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  customerType: string;
  vipStatus: boolean;
  source: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  country: "",
  customerType: "individual",
  vipStatus: false,
  source: "",
};

export default function CustomersPage() {
  const { t } = useAdminI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(query ? `/api/admin/customers?q=${encodeURIComponent(query)}` : "/api/admin/customers");
    setCustomers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName || null,
        phone: form.phone || null,
        email: form.email || null,
        country: form.country || null,
        customerType: form.customerType,
        vipStatus: form.vipStatus,
        source: form.source || null,
      }),
    });
    if (!res.ok) {
      setError(t.customers.cantAdd);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.customers.confirmDelete)) return;
    await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    load();
  }

  function customerTypeLabel(value: string) {
    if (value === "company") return t.customers.customerTypeCompany;
    if (value === "agency") return t.customers.customerTypeAgency;
    return t.customers.customerTypeIndividual;
  }

  return (
    <div>
      <PageHeader title={t.customers.title} description={t.customers.description} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Field label={t.common.search} className="w-72">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
          />
        </Field>
        <Button onClick={() => setShowForm((v) => !v)}>{t.customers.addButton}</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <Field label={t.customers.firstName} className="w-44">
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </Field>
            <Field label={t.customers.lastName} className="w-44">
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
            <Field label={t.common.phone} className="w-40">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </Field>
            <Field label={t.common.email} className="w-52">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label={t.customers.country} className="w-36">
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </Field>
            <Field label={t.customers.customerType} className="w-40">
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
            <Field label={t.customers.source} className="w-44">
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder={t.customers.sourcePlaceholder}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={form.vipStatus}
                onChange={(e) => setForm({ ...form, vipStatus: e.target.checked })}
              />
              {t.customers.vipStatus}
            </label>
            <Button type="submit">{t.common.add}</Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : customers.length === 0 ? (
          <EmptyState message={t.customers.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.customers.colName}</th>
                <th className="px-5 py-3 font-medium">{t.customers.colContact}</th>
                <th className="px-5 py-3 font-medium">{t.customers.colCountry}</th>
                <th className="px-5 py-3 font-medium">{t.customers.colType}</th>
                <th className="px-5 py-3 font-medium">{t.customers.colTrips}</th>
                <th className="px-5 py-3 font-medium">{t.customers.colTotalSpent}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-indigo-600">
                      {c.firstName} {c.lastName ?? ""}
                    </Link>
                    {c.vipStatus && (
                      <span className="ml-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold px-2 py-0.5">
                        VIP
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">{c.country || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {customerTypeLabel(c.customerType)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{c.tripsCount}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {c.totalSpentUsd > 0
                      ? `${formatUsd(c.totalSpentUsd)} / ${formatUzs(c.totalSpentUzs)}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link href={`/admin/customers/${c.id}`}>
                      <IconButton>{t.common.view}</IconButton>
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(c.id)}>
                      {t.common.delete}
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
