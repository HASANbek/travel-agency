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
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { localizedName } from "@/lib/localize";

type City = {
  id: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  country: string;
  _count: { attractions: number; localTransports: number };
};

type FormState = { name: string; nameRu: string; nameEn: string; country: string };
const emptyForm: FormState = { name: "", nameRu: "", nameEn: "", country: "Uzbekistan" };

export default function CitiesPage() {
  const { t, lang } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/cities");
    setCities(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toPayload(f: FormState) {
    return {
      name: f.name,
      nameRu: f.nameRu || null,
      nameEn: f.nameEn || null,
      country: f.country,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.cities.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(city: City) {
    setEditingId(city.id);
    setEditForm({
      name: city.name,
      nameRu: city.nameRu ?? "",
      nameEn: city.nameEn ?? "",
      country: city.country,
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/cities/${id}`, {
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
    if (!confirm(t.cities.confirmDelete)) return;
    await fetch(`/api/admin/cities/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.cities.title} description={t.cities.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.cities.cityName} className="w-40">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Samarqand"
            />
          </Field>
          <Field label={`${t.cities.cityName} (RU)`} className="w-40">
            <Input
              value={form.nameRu}
              onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
              placeholder="Самарканд"
            />
          </Field>
          <Field label={`${t.cities.cityName} (EN)`} className="w-40">
            <Input
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="Samarkand"
            />
          </Field>
          <Field label={t.cities.country} className="w-40">
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </Field>
          <Button type="submit">{t.common.add}</Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : cities.length === 0 ? (
          <EmptyState message={t.cities.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.cities.country}</th>
                <th className="px-5 py-3 font-medium">{t.cities.colAttractions}</th>
                <th className="px-5 py-3 font-medium">{t.cities.colTransport}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr
                  key={city.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === city.id ? (
                    <>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-1">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-24"
                            placeholder="UZ"
                          />
                          <Input
                            value={editForm.nameRu}
                            onChange={(e) => setEditForm({ ...editForm, nameRu: e.target.value })}
                            className="w-24"
                            placeholder="RU"
                          />
                          <Input
                            value={editForm.nameEn}
                            onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                            className="w-24"
                            placeholder="EN"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.country}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-32"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-gray-500">{city._count.attractions}</td>
                      <td className="px-5 py-2.5 text-gray-500">{city._count.localTransports}</td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(city.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{localizedName(city, lang)}</td>
                      <td className="px-5 py-3 text-gray-500">{city.country}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                          {city._count.attractions}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                          {city._count.localTransports}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(city)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(city.id)}>
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
