"use client";

import { useEffect, useState } from "react";
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
import { formatUsd, formatUzs } from "@/lib/format";
import { useAdminI18n } from "@/lib/admin-i18n";

type City = { id: number; name: string };
type Restaurant = {
  id: number;
  cityId: number;
  name: string;
  cuisine: string | null;
  capacity: number | null;
  pricePerPersonUsd: string | null;
  pricePerPersonUzs: string | null;
  city: City;
};

type FormState = {
  cityId: string;
  name: string;
  cuisine: string;
  capacity: string;
  pricePerPersonUsd: string;
  pricePerPersonUzs: string;
  phone: string;
};

const emptyForm: FormState = {
  cityId: "",
  name: "",
  cuisine: "",
  capacity: "",
  pricePerPersonUsd: "",
  pricePerPersonUzs: "",
  phone: "",
};

export default function RestaurantsPage() {
  const { t } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filterCityId, setFilterCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [citiesRes, restaurantsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch(filterCityId ? `/api/admin/restaurants?cityId=${filterCityId}` : "/api/admin/restaurants"),
    ]);
    setCities(await citiesRes.json());
    setRestaurants(await restaurantsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCityId]);

  function toPayload(f: FormState) {
    return {
      cityId: Number(f.cityId),
      name: f.name,
      cuisine: f.cuisine || null,
      capacity: f.capacity ? Number(f.capacity) : null,
      pricePerPersonUsd: f.pricePerPersonUsd ? Number(f.pricePerPersonUsd) : null,
      pricePerPersonUzs: f.pricePerPersonUzs ? Number(f.pricePerPersonUzs) : null,
      phone: f.phone || null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.restaurants.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(r: Restaurant) {
    setEditingId(r.id);
    setEditForm({
      cityId: String(r.cityId),
      name: r.name,
      cuisine: r.cuisine ?? "",
      capacity: r.capacity ? String(r.capacity) : "",
      pricePerPersonUsd: r.pricePerPersonUsd ?? "",
      pricePerPersonUzs: r.pricePerPersonUzs ?? "",
      phone: "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });
    if (!res.ok) {
      setError(t.common.cantUpdate);
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.restaurants.confirmDelete)) return;
    await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.restaurants.title} description={t.restaurants.description} />

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
          <Field label={t.restaurants.nameLabel} className="w-48">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.restaurants.cuisine} className="w-36">
            <Input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
          </Field>
          <Field label={t.restaurants.capacity} className="w-28">
            <Input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </Field>
          <Field label={t.restaurants.pricePerPersonUsd} className="w-32">
            <Input
              type="number"
              step="0.01"
              value={form.pricePerPersonUsd}
              onChange={(e) => setForm({ ...form, pricePerPersonUsd: e.target.value })}
            />
          </Field>
          <Field label={t.restaurants.pricePerPersonUzs} className="w-36">
            <Input
              type="number"
              step="0.01"
              value={form.pricePerPersonUzs}
              onChange={(e) => setForm({ ...form, pricePerPersonUzs: e.target.value })}
            />
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
        ) : restaurants.length === 0 ? (
          <EmptyState message={t.restaurants.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.restaurants.colName}</th>
                <th className="px-5 py-3 font-medium">{t.restaurants.cuisine}</th>
                <th className="px-5 py-3 font-medium">USD</th>
                <th className="px-5 py-3 font-medium">UZS</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === r.id ? (
                    <>
                      <td className="px-5 py-2.5">
                        <Select
                          value={editForm.cityId}
                          onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value })}
                          className="w-32"
                        >
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-40"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.cuisine}
                          onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                          className="w-32"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.pricePerPersonUsd}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pricePerPersonUsd: e.target.value })
                          }
                          className="w-24"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.pricePerPersonUzs}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pricePerPersonUzs: e.target.value })
                          }
                          className="w-28"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(r.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{r.city.name}</td>
                      <td className="px-5 py-3">{r.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">{r.cuisine || "—"}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUsd(r.pricePerPersonUsd)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUzs(r.pricePerPersonUzs)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(r)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(r.id)}>
                          {t.common.delete}
                        </IconButton>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
