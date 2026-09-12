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
type Ticket = {
  id: number;
  fromCityId: number;
  toCityId: number;
  trainName: string | null;
  priceUsd: string | null;
  priceUzs: string | null;
  fromCity: City;
  toCity: City;
};

type FormState = {
  fromCityId: string;
  toCityId: string;
  trainName: string;
  priceUsd: string;
  priceUzs: string;
};

const emptyForm: FormState = {
  fromCityId: "",
  toCityId: "",
  trainName: "",
  priceUsd: "",
  priceUzs: "",
};

export default function TrainTicketsPage() {
  const { t } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [citiesRes, ticketsRes] = await Promise.all([
      fetch("/api/admin/cities"),
      fetch("/api/admin/train-tickets"),
    ]);
    setCities(await citiesRes.json());
    setTickets(await ticketsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toPayload(f: FormState) {
    return {
      fromCityId: Number(f.fromCityId),
      toCityId: Number(f.toCityId),
      trainName: f.trainName || null,
      priceUsd: f.priceUsd ? Number(f.priceUsd) : null,
      priceUzs: f.priceUzs ? Number(f.priceUzs) : null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.fromCityId === form.toCityId) {
      setError(t.trainTickets.sameCity);
      return;
    }
    const res = await fetch("/api/admin/train-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.trainTickets.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(tk: Ticket) {
    setEditingId(tk.id);
    setEditForm({
      fromCityId: String(tk.fromCityId),
      toCityId: String(tk.toCityId),
      trainName: tk.trainName ?? "",
      priceUsd: tk.priceUsd ?? "",
      priceUzs: tk.priceUzs ?? "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/train-tickets/${id}`, {
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
    if (!confirm(t.trainTickets.confirmDelete)) return;
    await fetch(`/api/admin/train-tickets/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.trainTickets.title} description={t.trainTickets.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.trainTickets.fromCity} className="w-40">
            <Select
              value={form.fromCityId}
              onChange={(e) => setForm({ ...form, fromCityId: e.target.value })}
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
          <Field label={t.trainTickets.toCity} className="w-40">
            <Select
              value={form.toCityId}
              onChange={(e) => setForm({ ...form, toCityId: e.target.value })}
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
          <Field label={t.trainTickets.trainName} className="w-40">
            <Input
              value={form.trainName}
              onChange={(e) => setForm({ ...form, trainName: e.target.value })}
              placeholder="Afrosiyob"
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
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : tickets.length === 0 ? (
          <EmptyState message={t.trainTickets.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.trainTickets.colRoute}</th>
                <th className="px-5 py-3 font-medium">{t.trainTickets.colTrain}</th>
                <th className="px-5 py-3 font-medium">USD</th>
                <th className="px-5 py-3 font-medium">UZS</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tk) => (
                <tr
                  key={tk.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === tk.id ? (
                    <>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={editForm.fromCityId}
                            onChange={(e) => setEditForm({ ...editForm, fromCityId: e.target.value })}
                            className="w-28"
                          >
                            {cities.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                          <span className="text-gray-400">→</span>
                          <Select
                            value={editForm.toCityId}
                            onChange={(e) => setEditForm({ ...editForm, toCityId: e.target.value })}
                            className="w-28"
                          >
                            {cities.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.trainName}
                          onChange={(e) => setEditForm({ ...editForm, trainName: e.target.value })}
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
                        <IconButton onClick={() => handleUpdate(tk.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">
                        {tk.fromCity.name}
                        <span className="mx-1.5 text-gray-400">→</span>
                        {tk.toCity.name}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {tk.trainName || "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{formatUsd(tk.priceUsd)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatUzs(tk.priceUzs)}</td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(tk)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(tk.id)}>
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
