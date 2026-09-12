"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  EmptyState,
  Field,
  IconButton,
  LoadingRows,
  PageHeader,
  Select,
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { BOOKING_STATUSES } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type Tour = { id: number; name: string };
type Customer = { id: number; firstName: string; lastName: string | null };
type Booking = {
  id: number;
  status: string;
  totalUsd: string;
  totalUzs: string;
  paidUsd: number;
  paidUzs: number;
  tour: Tour;
  customer: Customer | null;
};

export default function BookingsPage() {
  const { t } = useAdminI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(
      statusFilter ? `/api/admin/bookings?status=${statusFilter}` : "/api/admin/bookings"
    );
    setBookings(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleDelete(id: number) {
    if (!confirm(t.tours.confirmDelete)) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    load();
  }

  function statusLabel(status: string) {
    const key = `status${status
      .split("_")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? status;
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
    completed: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <div>
      <PageHeader title={t.bookings.title} description={t.bookings.description} />

      <div className="mb-4">
        <Field label={t.inquiries.filterByStatus} className="w-56">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t.inquiries.allStatuses}</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : bookings.length === 0 ? (
          <EmptyState message={t.bookings.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.bookings.colTour}</th>
                <th className="px-5 py-3 font-medium">{t.bookings.colCustomer}</th>
                <th className="px-5 py-3 font-medium">{t.bookings.colTotal}</th>
                <th className="px-5 py-3 font-medium">{t.bookings.colPaid}</th>
                <th className="px-5 py-3 font-medium">{t.bookings.colStatus}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/bookings/${b.id}`} className="hover:text-indigo-600">
                      {b.tour.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {b.customer ? `${b.customer.firstName} ${b.customer.lastName ?? ""}` : "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatUsd(b.totalUsd)} <span className="text-gray-400">/ {formatUzs(b.totalUzs)}</span>
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatUsd(b.paidUsd)} <span className="text-gray-400">/ {formatUzs(b.paidUzs)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                        statusColors[b.status] ?? ""
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link href={`/admin/bookings/${b.id}`}>
                      <IconButton>{t.common.view}</IconButton>
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(b.id)}>
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
