"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  EmptyState,
  IconButton,
  LoadingRows,
  PageHeader,
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";

type Tour = { id: number; name: string };
type Customer = { id: number; firstName: string; lastName: string | null };
type Quotation = {
  id: number;
  version: number;
  status: string;
  validUntil: string | null;
  tour: Tour;
  customer: Customer | null;
};

export default function QuotationsPage() {
  const { t } = useAdminI18n();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/quotations");
    setQuotations(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm(t.quotations.confirmDelete)) return;
    await fetch(`/api/admin/quotations/${id}`, { method: "DELETE" });
    load();
  }

  function statusLabel(status: string) {
    const key = `status${status[0].toUpperCase()}${status.slice(1)}` as keyof typeof t.quotations;
    return (t.quotations[key] as string) ?? status;
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70",
    sent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
    viewed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    expired: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  };

  return (
    <div>
      <PageHeader title={t.quotations.title} description={t.quotations.description} />

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : quotations.length === 0 ? (
          <EmptyState message={t.quotations.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.quotations.colTour}</th>
                <th className="px-5 py-3 font-medium">{t.quotations.colCustomer}</th>
                <th className="px-5 py-3 font-medium">{t.quotations.colVersion}</th>
                <th className="px-5 py-3 font-medium">{t.quotations.colValidUntil}</th>
                <th className="px-5 py-3 font-medium">{t.quotations.colStatus}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/quotations/${q.id}`} className="hover:text-indigo-600">
                      {q.tour.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {q.customer
                      ? `${q.customer.firstName} ${q.customer.lastName ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums">v{q.version}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {q.validUntil || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                        statusColors[q.status] ?? ""
                      }`}
                    >
                      {statusLabel(q.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link href={`/admin/quotations/${q.id}`}>
                      <IconButton>{t.common.view}</IconButton>
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(q.id)}>
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
