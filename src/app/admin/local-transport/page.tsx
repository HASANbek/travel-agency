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
type Transport = {
  id: number;
  cityId: number;
  type: string;
  location: string | null;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  description: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  phone: string | null;
  priceUsd: string | null;
  priceUzs: string | null;
  city: City;
};

type FormState = {
  cityId: string;
  type: string;
  location: string;
  name: string;
  nameRu: string;
  nameEn: string;
  description: string;
  descriptionRu: string;
  descriptionEn: string;
  phone: string;
  priceUsd: string;
  priceUzs: string;
};

const emptyForm: FormState = {
  cityId: "",
  type: "local",
  location: "",
  name: "",
  nameRu: "",
  nameEn: "",
  description: "",
  descriptionRu: "",
  descriptionEn: "",
  phone: "",
  priceUsd: "",
  priceUzs: "",
};

export default function LocalTransportPage() {
  const { t, lang } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [filterCityId, setFilterCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [showTranslations, setShowTranslations] = useState(false);

  async function load() {
    setLoading(true);
    const [citiesRes, transportsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch(
        filterCityId
          ? `/api/admin/local-transport?cityId=${filterCityId}`
          : "/api/admin/local-transport"
      ),
    ]);
    setCities(await citiesRes.json());
    setTransports(await transportsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCityId]);

  function toPayload(f: FormState) {
    return {
      cityId: Number(f.cityId),
      type: f.type,
      location: f.type === "transfer" ? f.location || null : null,
      name: f.name,
      nameRu: f.nameRu || null,
      nameEn: f.nameEn || null,
      description: f.description || null,
      descriptionRu: f.descriptionRu || null,
      descriptionEn: f.descriptionEn || null,
      phone: f.phone || null,
      priceUsd: f.priceUsd ? Number(f.priceUsd) : null,
      priceUzs: f.priceUzs ? Number(f.priceUzs) : null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/local-transport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.transport.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(tp: Transport) {
    setEditingId(tp.id);
    setEditForm({
      cityId: String(tp.cityId),
      type: tp.type,
      location: tp.location ?? "",
      name: tp.name,
      nameRu: tp.nameRu ?? "",
      nameEn: tp.nameEn ?? "",
      description: tp.description ?? "",
      descriptionRu: tp.descriptionRu ?? "",
      descriptionEn: tp.descriptionEn ?? "",
      phone: tp.phone ?? "",
      priceUsd: tp.priceUsd ?? "",
      priceUzs: tp.priceUzs ?? "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/local-transport/${id}`, {
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
    if (!confirm(t.transport.confirmDelete)) return;
    await fetch(`/api/admin/local-transport/${id}`, { method: "DELETE" });
    load();
  }

  function locationLabel(location: string | null) {
    if (location === "airport") return t.transport.locationAirport;
    if (location === "station") return t.transport.locationStation;
    if (location === "border") return t.transport.locationBorder;
    return "—";
  }

  return (
    <div>
      <PageHeader title={t.transport.title} description={t.transport.description} />

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
          <Field label={t.transport.typeLabel} className="w-44">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="local">{t.transport.typeLocal}</option>
              <option value="transfer">{t.transport.typeTransfer}</option>
            </Select>
          </Field>
          {form.type === "transfer" && (
            <Field label={t.transport.locationLabel} className="w-40">
              <Select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              >
                <option value="">{t.common.select}</option>
                <option value="airport">{t.transport.locationAirport}</option>
                <option value="station">{t.transport.locationStation}</option>
                <option value="border">{t.transport.locationBorder}</option>
              </Select>
            </Field>
          )}
          <Field label={t.transport.nameLabel} className="w-52">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Gid mashinasi (sedan)"
            />
          </Field>
          <Field label={t.common.description} className="w-52">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label={t.common.phone} className="w-40">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+998 90 123 45 67"
            />
          </Field>
          <Field label={t.common.priceUsd} className="w-32">
            <Input
              type="number"
              step="0.01"
              value={form.priceUsd}
              onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
            />
          </Field>
          <Field label={t.common.priceUzs} className="w-36">
            <Input
              type="number"
              step="0.01"
              value={form.priceUzs}
              onChange={(e) => setForm({ ...form, priceUzs: e.target.value })}
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
            <Field label={`${t.transport.nameLabel} (RU)`} className="w-52">
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
            <Field label={`${t.transport.nameLabel} (EN)`} className="w-52">
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
        ) : transports.length === 0 ? (
          <EmptyState message={t.transport.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.common.city}</th>
                <th className="px-5 py-3 font-medium">{t.transport.colType}</th>
                <th className="px-5 py-3 font-medium">{t.transport.colLocation}</th>
                <th className="px-5 py-3 font-medium">{t.transport.colName}</th>
                <th className="px-5 py-3 font-medium">{t.common.description}</th>
                <th className="px-5 py-3 font-medium">{t.common.phone}</th>
                <th className="px-5 py-3 font-medium">USD</th>
                <th className="px-5 py-3 font-medium">UZS</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transports.map((tp) => (
                <tr
                  key={tp.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === tp.id ? (
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
                        <Select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-36"
                        >
                          <option value="local">{t.transport.typeLocal}</option>
                          <option value="transfer">{t.transport.typeTransfer}</option>
                        </Select>
                      </td>
                      <td className="px-5 py-2.5">
                        {editForm.type === "transfer" && (
                          <Select
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-32"
                          >
                            <option value="">{t.common.select}</option>
                            <option value="airport">{t.transport.locationAirport}</option>
                            <option value="station">{t.transport.locationStation}</option>
                            <option value="border">{t.transport.locationBorder}</option>
                          </Select>
                        )}
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
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-32"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.priceUsd}
                          onChange={(e) => setEditForm({ ...editForm, priceUsd: e.target.value })}
                          className="w-24"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.priceUzs}
                          onChange={(e) => setEditForm({ ...editForm, priceUzs: e.target.value })}
                          className="w-28"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(tp.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{tp.city.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {tp.type === "transfer" ? t.transport.typeTransfer : t.transport.typeLocal}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {tp.type === "transfer" ? locationLabel(tp.location) : "—"}
                      </td>
                      <td className="px-5 py-3">{localizedName(tp, lang)}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {localizedDescription(tp, lang) || "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {tp.phone || "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{formatUsd(tp.priceUsd)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUzs(tp.priceUzs)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(tp)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(tp.id)}>
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
