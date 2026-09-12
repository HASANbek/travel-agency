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
import { useAdminI18n } from "@/lib/admin-i18n";
import { EXPENSE_CATEGORIES } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type Expense = {
  id: number;
  category: string;
  description: string;
  amountUsd: string | null;
  amountUzs: string | null;
  date: string;
};

const emptyForm = {
  category: "other",
  description: "",
  amountUsd: "",
  amountUzs: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function ExpensesPage() {
  const { t } = useAdminI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/expenses");
    setExpenses(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function categoryLabel(cat: string) {
    const key = `category${cat[0].toUpperCase()}${cat.slice(1)}` as keyof typeof t.expenses;
    return (t.expenses[key] as string) ?? cat;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category,
        description: form.description,
        amountUsd: form.amountUsd ? Number(form.amountUsd) : null,
        amountUzs: form.amountUzs ? Number(form.amountUzs) : null,
        date: form.date,
      }),
    });
    if (!res.ok) {
      setError(t.expenses.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.expenses.confirmDelete)) return;
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const totalUsd = expenses.reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);
  const totalUzs = expenses.reduce((sum, e) => sum + Number(e.amountUzs ?? 0), 0);

  return (
    <div>
      <PageHeader title={t.expenses.title} description={t.expenses.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.expenses.category} className="w-40">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.expenses.descriptionLabel} className="w-52">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </Field>
          <Field label={t.expenses.date} className="w-40">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label={t.common.priceUsd} className="w-32">
            <Input
              type="number"
              step="0.01"
              value={form.amountUsd}
              onChange={(e) => setForm({ ...form, amountUsd: e.target.value })}
            />
          </Field>
          <Field label={t.common.priceUzs} className="w-36">
            <Input
              type="number"
              step="0.01"
              value={form.amountUzs}
              onChange={(e) => setForm({ ...form, amountUzs: e.target.value })}
            />
          </Field>
          <Button type="submit">{t.common.add}</Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="p-4 mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-white/50">{t.expenses.totalExpenses}</span>
        <span className="tabular-nums font-semibold text-red-600 dark:text-red-400">
          {formatUsd(totalUsd)} / {formatUzs(totalUzs)}
        </span>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : expenses.length === 0 ? (
          <EmptyState message={t.expenses.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.expenses.colDate}</th>
                <th className="px-5 py-3 font-medium">{t.expenses.colCategory}</th>
                <th className="px-5 py-3 font-medium">{t.expenses.colDescription}</th>
                <th className="px-5 py-3 font-medium">{t.expenses.colAmount}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 tabular-nums text-gray-500 dark:text-white/50">{e.date}</td>
                  <td className="px-5 py-3">{categoryLabel(e.category)}</td>
                  <td className="px-5 py-3">{e.description}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatUsd(e.amountUsd)} <span className="text-gray-400">/ {formatUzs(e.amountUzs)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <IconButton variant="danger" onClick={() => handleDelete(e.id)}>
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
