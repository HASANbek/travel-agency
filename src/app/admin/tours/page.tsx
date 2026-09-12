"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  LoadingRows,
  PageHeader,
  iconButtonClass,
} from "@/components/admin/ui";
import { useRouter } from "next/navigation";
import { formatUsd, formatUzs } from "@/lib/format";
import { useAdminI18n } from "@/lib/admin-i18n";
import { localizedName } from "@/lib/localize";

type Tour = {
  id: number;
  name: string;
  totalUsd: string;
  totalUzs: string;
  updatedAt: string;
  cities: { city: { id: number; name: string; nameRu: string | null; nameEn: string | null } }[];
};

export default function ToursListPage() {
  const { t, lang } = useAdminI18n();
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tours");
    setTours(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm(t.tours.confirmDelete)) return;
    await fetch(`/api/admin/tours/${id}`, { method: "DELETE" });
    load();
  }

  async function handleQuotation(tourId: number) {
    setCreatingId(tourId);
    try {
      const res = await fetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId }),
      });
      if (res.ok) {
        const quotation = await res.json();
        router.push(`/admin/quotations/${quotation.id}`);
      }
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader title={t.tours.title} description={t.tours.description} />
        <Link href="/admin/tours/new">
          <Button>{t.tours.createButton}</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : tours.length === 0 ? (
          <EmptyState message={t.tours.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.tours.colName}</th>
                <th className="px-5 py-3 font-medium">{t.tours.colRoute}</th>
                <th className="px-5 py-3 font-medium">{t.tours.colPrice}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr
                  key={tour.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">{tour.name}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {tour.cities.map((c) => localizedName(c.city, lang)).join(" → ")}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatUsd(tour.totalUsd)}{" "}
                    <span className="text-gray-400">/ {formatUzs(tour.totalUzs)}</span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <IconButton
                      onClick={() => handleQuotation(tour.id)}
                      disabled={creatingId === tour.id}
                    >
                      {creatingId === tour.id ? t.tours.pdfPreparing : t.tours.quotationButton}
                    </IconButton>
                    <Link href={`/admin/tours/${tour.id}`} className={iconButtonClass()}>
                      {t.common.edit}
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(tour.id)}>
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
