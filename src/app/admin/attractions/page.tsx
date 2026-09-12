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
import { localizedDescription, localizedName } from "@/lib/localize";

type City = { id: number; name: string };
type Attraction = {
  id: number;
  cityId: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  description: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  entranceFeeUsd: string | null;
  entranceFeeUzs: string | null;
  city: City;
};

type FormState = {
  cityId: string;
  name: string;
  nameRu: string;
  nameEn: string;
  description: string;
  descriptionRu: string;
  descriptionEn: string;
  entranceFeeUsd: string;
  entranceFeeUzs: string;
};

const emptyForm: FormState = {
  cityId: "",
  name: "",
  nameRu: "",
  nameEn: "",
  description: "",
  descriptionRu: "",
  descriptionEn: "",
  entranceFeeUsd: "",
  entranceFeeUzs: "",
};

export default function AttractionsPage() {
  const { t, lang } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [filterCityId, setFilterCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [showTranslations, setShowTranslations] = useState(false);

  async function load() {
    setLoading(true);
    const [citiesRes, attractionsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch(
        filterCityId
          ? `/api/admin/attractions?cityId=${filterCityId}`
          : "/api/admin/attractions"
      ),
    ]);
    setCities(await citiesRes.json());
    setAttractions(await attractionsRes.json());
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
      nameRu: f.nameRu || null,
      nameEn: f.nameEn || null,
      description: f.description || null,
      descriptionRu: f.descriptionRu || null,
      descriptionEn: f.descriptionEn || null,
      entranceFeeUsd: f.entranceFeeUsd ? Number(f.entranceFeeUsd) : null,
      entranceFeeUzs: f.entranceFeeUzs ? Number(f.entranceFeeUzs) : null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/attractions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.attractions.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(a: Attraction) {
    setEditingId(a.id);
    setEditForm({
      cityId: String(a.cityId),
      name: a.name,
      nameRu: a.nameRu ?? "",
      nameEn: a.nameEn ?? "",
      description: a.description ?? "",
      descriptionRu: a.descriptionRu ?? "",
      descriptionEn: a.descriptionEn ?? "",
      entranceFeeUsd: a.entranceFeeUsd ?? "",
      entranceFeeUzs: a.entranceFeeUzs ?? "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/attractions/${id}`, {
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
    if (!confirm(t.attractions.confirmDelete)) return;
    await fetch(`/api/admin/attractions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.attractions.title} description={t.attractions.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.common.city} className="w-40">
            <Select
              value={form.cityId}
              onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              required
            >
              <option value="">{t.common.selectCity}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.attractions.nameLabel} className="w-52">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Registon maydoni"
            />
          </Field>
          <Field label={t.common.description} className="w-52">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label={t.attractions.entranceUsd} className="w-32">
            <Input
              type="number"
              step="0.01"
              value={form.entranceFeeUsd}
              onChange={(e) => setForm({ ...form, entranceFeeUsd: e.target.value })}
            />
          </Field>
          <Field label={t.attractions.entranceUzs} className="w-36">
            <Input
              type="number"
              step="0.01"
              value={form.entranceFeeUzs}
              onChange={(e) => setForm({ ...form, entranceFeeUzs: e.target.value })}
            />
          </Field>
          <Button type="submit">{t.common.add}</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowTranslations((v) => !v)}
          >
            RU / EN
          </Button>
        </form>

        {showTranslations && (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 dark:border-white/10 pt-3">
            <Field label={`${t.attractions.nameLabel} (RU)`} className="w-52">
              <Input
                value={form.nameRu}
                onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
              />
            </Field>
            <Field label={`${t.common.description} (RU)`} className="w-64">
              <Input
                value={form.descriptionRu}
                onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
              />
            </Field>
            <Field label={`${t.attractions.nameLabel} (EN)`} className="w-52">
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </Field>
            <Field label={`${t.common.description} (EN)`} className="w-64">
              <Input
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              />
            </Field>
          </div>
        )}
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
        ) : attractions.length === 0 ? (
          <EmptyState message={t.attractions.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.attractions.colName}</th>
                <th className="px-5 py-3 font-medium">{t.common.description}</th>
                <th className="px-5 py-3 font-medium">USD</th>
                <th className="px-5 py-3 font-medium">UZS</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attractions.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === a.id ? (
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
                        <div className="flex flex-col gap-1">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-40"
                            placeholder="UZ"
                          />
                          <Input
                            value={editForm.nameRu}
                            onChange={(e) => setEditForm({ ...editForm, nameRu: e.target.value })}
                            className="w-40"
                            placeholder="RU"
                          />
                          <Input
                            value={editForm.nameEn}
                            onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                            className="w-40"
                            placeholder="EN"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col gap-1">
                          <Input
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            className="w-40"
                            placeholder="UZ"
                          />
                          <Input
                            value={editForm.descriptionRu}
                            onChange={(e) =>
                              setEditForm({ ...editForm, descriptionRu: e.target.value })
                            }
                            className="w-40"
                            placeholder="RU"
                          />
                          <Input
                            value={editForm.descriptionEn}
                            onChange={(e) =>
                              setEditForm({ ...editForm, descriptionEn: e.target.value })
                            }
                            className="w-40"
                            placeholder="EN"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.entranceFeeUsd}
                          onChange={(e) => setEditForm({ ...editForm, entranceFeeUsd: e.target.value })}
                          className="w-24"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.entranceFeeUzs}
                          onChange={(e) => setEditForm({ ...editForm, entranceFeeUzs: e.target.value })}
                          className="w-28"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(a.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{a.city.name}</td>
                      <td className="px-5 py-3">{localizedName(a, lang)}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {localizedDescription(a, lang) || "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{formatUsd(a.entranceFeeUsd)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUzs(a.entranceFeeUzs)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(a)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(a.id)}>
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
