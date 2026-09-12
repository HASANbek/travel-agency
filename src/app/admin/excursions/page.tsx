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
type Excursion = {
  id: number;
  cityId: number;
  name: string;
  category: string | null;
  durationHours: string | null;
  sellUsd: string | null;
  sellUzs: string | null;
  city: City;
};

type FormState = {
  cityId: string;
  name: string;
  category: string;
  durationHours: string;
  sellUsd: string;
  sellUzs: string;
};

const emptyForm: FormState = {
  cityId: "",
  name: "",
  category: "",
  durationHours: "",
  sellUsd: "",
  sellUzs: "",
};

export default function ExcursionsPage() {
  const { t } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filterCityId, setFilterCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [citiesRes, excursionsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch(filterCityId ? `/api/admin/excursions?cityId=${filterCityId}` : "/api/admin/excursions"),
    ]);
    setCities(await citiesRes.json());
    setExcursions(await excursionsRes.json());
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
      category: f.category || null,
      durationHours: f.durationHours ? Number(f.durationHours) : null,
      sellUsd: f.sellUsd ? Number(f.sellUsd) : null,
      sellUzs: f.sellUzs ? Number(f.sellUzs) : null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/excursions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.excursions.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(ex: Excursion) {
    setEditingId(ex.id);
    setEditForm({
      cityId: String(ex.cityId),
      name: ex.name,
      category: ex.category ?? "",
      durationHours: ex.durationHours ?? "",
      sellUsd: ex.sellUsd ?? "",
      sellUzs: ex.sellUzs ?? "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/excursions/${id}`, {
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
    if (!confirm(t.excursions.confirmDelete)) return;
    await fetch(`/api/admin/excursions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.excursions.title} description={t.excursions.description} />

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
          <Field label={t.excursions.nameLabel} className="w-48">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.excursions.category} className="w-36">
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label={t.excursions.durationHours} className="w-28">
            <Input
              type="number"
              step="0.5"
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
            />
          </Field>
          <Field label={t.excursions.sellUsd} className="w-32">
            <Input
              type="number"
              step="0.01"
              value={form.sellUsd}
              onChange={(e) => setForm({ ...form, sellUsd: e.target.value })}
            />
          </Field>
          <Field label={t.excursions.sellUzs} className="w-36">
            <Input
              type="number"
              step="0.01"
              value={form.sellUzs}
              onChange={(e) => setForm({ ...form, sellUzs: e.target.value })}
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
        ) : excursions.length === 0 ? (
          <EmptyState message={t.excursions.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.excursions.colName}</th>
                <th className="px-5 py-3 font-medium">{t.excursions.category}</th>
                <th className="px-5 py-3 font-medium">USD</th>
                <th className="px-5 py-3 font-medium">UZS</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {excursions.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === ex.id ? (
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
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-32"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.sellUsd}
                          onChange={(e) => setEditForm({ ...editForm, sellUsd: e.target.value })}
                          className="w-24"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.sellUzs}
                          onChange={(e) => setEditForm({ ...editForm, sellUzs: e.target.value })}
                          className="w-28"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(ex.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{ex.city.name}</td>
                      <td className="px-5 py-3">{ex.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">{ex.category || "—"}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUsd(ex.sellUsd)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUzs(ex.sellUzs)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(ex)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(ex.id)}>
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
