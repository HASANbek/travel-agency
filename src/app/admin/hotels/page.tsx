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

type City = { id: number; name: string };
type Hotel = {
  id: number;
  cityId: number;
  name: string;
  stars: number;
  address: string | null;
  city: City;
};

type FormState = {
  cityId: string;
  name: string;
  address: string;
  stars: string;
};

const emptyForm: FormState = { cityId: "", name: "", address: "", stars: "3" };

export default function HotelsPage() {
  const { t } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filterCityId, setFilterCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [citiesRes, hotelsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch(filterCityId ? `/api/admin/hotels?cityId=${filterCityId}` : "/api/admin/hotels"),
    ]);
    setCities(await citiesRes.json());
    setHotels(await hotelsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCityId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: Number(form.cityId),
        name: form.name,
        address: form.address || null,
        stars: Number(form.stars) || 3,
      }),
    });
    if (!res.ok) {
      setError(t.hotels.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.hotels.confirmDelete)) return;
    await fetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.hotels.title} description={t.hotels.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.common.city} className="w-40">
            <Select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required>
              <option value="">{t.common.selectCity}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.hotels.nameLabel} className="w-52">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.hotels.address} className="w-52">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label={t.hotels.stars} className="w-28">
            <Select value={form.stars} onChange={(e) => setForm({ ...form, stars: e.target.value })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">{t.common.add}</Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <div className="mb-4">
        <Field label={t.common.filterByCity} className="w-56">
          <Select value={filterCityId} onChange={(e) => setFilterCityId(e.target.value)}>
            <option value="">{t.common.allCities}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : hotels.length === 0 ? (
          <EmptyState message={t.hotels.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.hotels.colName}</th>
                <th className="px-5 py-3 font-medium">{t.hotels.colStars}</th>
                <th className="px-5 py-3 font-medium">{t.hotels.address}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">{h.city.name}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/hotels/${h.id}`} className="hover:text-indigo-600">
                      {h.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{"★".repeat(h.stars)}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">{h.address || "—"}</td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link href={`/admin/hotels/${h.id}`}>
                      <IconButton>{t.common.view}</IconButton>
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(h.id)}>
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
